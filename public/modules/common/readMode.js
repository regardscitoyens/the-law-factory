'use strict';

angular.module('theLawFactory')
.directive('readMode', ['$location', function($location) {
    return {
        restrict: 'A',
        controller: function($scope) {
            $scope.read = $location.search()['read'] === '1';

            $scope.readmode = function () {
                $(".text").css({"width": "93.43%", "left": "3.3%"});
                $(".gotomod").addClass('readmode');
                $location.search('read', '1');
                $scope.read = true;
            };

            $scope.viewmode = function () {
                $(".text").css({"width": "23.40%", "left": "73.3%"});
                $(".gotomod").removeClass('readmode');
                $location.search('read', null);
                $scope.read = false;
            };

            if ($scope.read) {
                $scope.readmode();
            }
        }
    }
}]);
