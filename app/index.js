'use strict';

var moonApp = angular.module('moonApp', []);

/* Controllers */
moonApp.controller('MoonCtrl', function($scope) {
    
    $scope.geoLocation = {};
    $scope.today = new Date();
    $scope.moonInfo = {};
    
    // define default values for lat and long (London)
    var latitude = 26.12;
    var longitude = -80.14;
    
    // get the users current location if available
    // TODO: Find a better way to do this. Maybe a custom angular directive / package
    // As described in: http://stackoverflow.com/questions/23185619/how-can-i-use-html5-geolocation-in-angularjs
    // or this: http://blog.rangle.io/two-ways-to-build-a-location-picker-for-a-mobile-angularjs-application/
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position){
            $scope.$apply(function(){
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;

                $scope.geoLocation.lat = latitude;
                $scope.geoLocation.long = longitude;
            });
        });
    }
    
    // get today's sunlight times 
    $scope.times = SunCalc.getTimes($scope.today, latitude, longitude);
    
    //get moon info
    $scope.moonInfo.illumination = SunCalc.getMoonIllumination($scope.today);
    $scope.moonInfo.times = SunCalc.getMoonTimes($scope.today, latitude, longitude);
       
});
