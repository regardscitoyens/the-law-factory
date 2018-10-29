'use strict';

angular.module('theLawFactory')
.directive('home', ['$rootScope', 'api',
function ($rootScope, api) {
    return {
        restrict: 'A',
        replace: false,
        templateUrl: 'modules/home/home.html',
        controller: function ($scope) {
            $scope.colonnes = [];
            api.getHome().then(function (data) {
                $scope.total = data.total;
                $scope.maximum = data.maximum;
                $scope.colonnes = [data.live, data.recent, data.focus];
            });
        }
    };
}]);
