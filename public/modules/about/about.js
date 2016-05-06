'use strict';

angular.module('theLawFactory')
.directive('about', ['$rootScope',
function ($rootScope) {
    return {
        restrict: 'A',
        replace: false,
        templateUrl: 'modules/about/about.html',
        controller: function ($scope) {
            $rootScope.pageTitle = " À propos | ";
            $scope.mod = "about";
        }
    }
}]);