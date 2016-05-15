'use strict';

var moonApp = angular.module('moonApp', []);

/* Controllers */
moonApp.controller('MoonCtrl', ['$scope', '$q', 'locationService', function($scope, $q, locationService) {
    
    $scope.location = {};
    $scope.today = new Date();
    $scope.moonInfo = {};
    $scope.error;
    
    var getLocationByCurrentPosition = function () {    
        var deferred = $q.defer();
         
        locationService.getLocationByCurrentPosition().then(function () {
            $scope.location.lat = locationService.lat;
            $scope.location.lng = locationService.lng;            
            deferred.resolve();
            
        }, function (error) {
            // in case of error, use some default coordinates (LA)
            $scope.location.lat = 33.9697897;
            $scope.location.lng = -118.2468148;
            $scope.error = 'enable location permission to get info on your location.';
            deferred.resolve();
        });
        
        return deferred.promise;
    }
    
    var getLocationByLatLng = function () {    
        locationService.getLocationByLatLng($scope.location.lat, $scope.location.lng).then(function () {
            $scope.location.city = locationService.city;
            $scope.location.state = locationService.state;
            $scope.location.zip = locationService.zip;
            
        }, function (error) {
            $scope.error = error;
        });
    }
    
    var calculateMoonInfo = function () {
        // get today's sunlight times 
        $scope.times = SunCalc.getTimes($scope.today, $scope.location.lat, $scope.location.lng);
        
        // get moon info
        $scope.moonInfo.illumination = SunCalc.getMoonIllumination($scope.today);
        $scope.moonInfo.times = SunCalc.getMoonTimes($scope.today, $scope.location.lat, $scope.location.lng);
    }
    
    var processLocation = function () {
        // do these steps once we have the coordinates
        // they are not dependent on each other so we don't need to wait
        getLocationByLatLng();
        calculateMoonInfo();
    }
    
    // get the current coordinates, then use it to locate the city and process moon times
    getLocationByCurrentPosition().then(processLocation);
      
    // get the users current location if available
    // As described in: http://stackoverflow.com/questions/23185619/how-can-i-use-html5-geolocation-in-angularjs
    // or this: http://blog.rangle.io/two-ways-to-build-a-location-picker-for-a-mobile-angularjs-application/
    /*
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position){
            $scope.$apply(function(){
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;

                $scope.location.lat = latitude;
                $scope.location.lng = longitude;
            });
        });
    }
    */
    
    // this is just for debugging purposes
    function sleepFor( sleepDuration ){
        var now = new Date().getTime();
        while(new Date().getTime() < now + sleepDuration){ /* do nothing */ } 
    }
       
}]);

/* Services */
moonApp.factory('locationService', ['$window', '$http', '$q', function($window, $http, $q) {
   var service = {};
   
   service.getLocationByCurrentPosition = function getCurrentPosition() {
        var deferred = $q.defer();

        if (!$window.navigator.geolocation) {
            deferred.reject('Geolocation not supported.');
        } else {
            $window.navigator.geolocation.getCurrentPosition(
                function (position) {
                    service.lat = position.coords.latitude;
                    service.lng = position.coords.longitude;
                    deferred.resolve();
                },
                function (err) {
                    deferred.reject(err);
                });
        }

        return deferred.promise;
   }
          
   service.getLocationByLatLng = function (lat, lng) {
        var config = {
            method: 'GET',
            url: 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + lat + ',' + lng,
        };

        return $http(config).then(function (response) {
            if (response.data.status == 'OK') {
                // check result 0
                var result = response.data.results[0];
                
                // look for appropraite types
                // is there a better way to do this?
                for(var i=0, len=result.address_components.length; i<len; i++) {
                    var ac = result.address_components[i];
                    if(ac.types.indexOf("locality") >= 0) service.city = ac.long_name;
                    if(ac.types.indexOf("administrative_area_level_1") >= 0) service.state = ac.short_name;
                    if(ac.types.indexOf("postal_code") >= 0) service.zip = ac.long_name;
                }
            }
        }, function (error) {
            return $q.reject(error);
        });
    };
   
   /* we are not using this yet
   service.getCityByZip = function (zip) {
        var config = {
            method: 'GET',
            url: 'https://maps.googleapis.com/maps/api/geocode/json?address=' + zip,
        };

        return $http(config).then(function (response) {
            service.city = response.data.results[0].formatted_address;
        }, function (error) {
            return $q.reject(error);
        });
    };
    */
   
   return service;
}]);