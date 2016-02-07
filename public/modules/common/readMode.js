'use strict';

angular.module('theLawFactory')
.directive('readMode', ['$location', function($location) {
    return {
        restrict: 'A',
        controller: function($scope) {
            $scope.read = $location.search()['read'] === '1';

            $scope.readmode = function () {
                $("#sidebar").addClass('readmode');
                $location.search('read', '1');
                $scope.read = true;
            };

            $scope.viewmode = function () {
                $("#sidebar").removeClass('readmode');
                $location.search('read', null);
                $scope.read = false;
            };

            if ($scope.read) {
                $scope.readmode();
            }
        }
    }
}]);
