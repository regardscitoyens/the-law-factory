angular.module('theLawFactory.about', [])
    .directive('about', ['$rootScope', function ($rootScope) {
            return {
                restrict: 'A',
                replace: false,
                templateUrl: 'templates/about.html',
                controller: function ($scope) {
                    $rootScope.pageTitle = " À propos | ";
                    $scope.mod = "about";
                }
            }
        }]);