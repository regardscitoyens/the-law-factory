'use strict';

angular.module('theLawFactory.readMode', [])
    .directive('readMode', function() {
        return {
            restrict: 'A',
            controller: function($scope) {
                $scope.read = false;
                $scope.readmode = function () {
                    $(".text").css({"width": "93.43%", "left": "3.3%"});
                    $(".gotomod").addClass('readmode');
                    $scope.read = true;
                };
                $scope.viewmode = function () {
                    $(".text").css({"width": "23.40%", "left": "73.3%"});
                    $(".gotomod").removeClass('readmode');
                    $scope.read = false;
                };
            }
        }
    });
