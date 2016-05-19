'use strict';

angular.module('theLawFactory')
.directive('readMode', ['$location', function($location) {
    return {
        restrict: 'A',
        controller: function($rootScope, $scope) {
            $rootScope.read = $location.search()['read'] === '1';

            $rootScope.readmode = function () {
                $("#sidebar").addClass('readmode');
                if ($scope.mod === 'amendements') {
                    $location.replace();
                    $location.search('read', '1');
                }
                $rootScope.read = true;
            };

            $rootScope.viewmode = function () {
                $("#sidebar").removeClass('readmode');
                if ($scope.mod === 'amendements') {
                    $location.replace();
                    $location.search('read', null);
                }
                $rootScope.read = false;
            };

            if ($rootScope.read) {
                $rootScope.readmode();
            }
        }
    }
}]);
