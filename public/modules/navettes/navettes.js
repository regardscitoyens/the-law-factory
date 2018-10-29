'use strict';

angular.module('theLawFactory')
.directive('navettes', ['api', '$rootScope', '$location', '$compile',
function (api, $rootScope) {
    return {
        restrict: 'A',
        replace: false,
        templateUrl: 'modules/navettes/navettes.html',
        controller: function ($scope) {
            $scope.mod = "navettes";
            $scope.setHelpText("Chaque ligne représente la chronologie des débats sur un projet ou une proposition de loi. La couleur indique l'institution en charge du texte à un instant donné (Assemblée en bleu, Sénat en rouge...). Cliquez sur un texte pour en consulter le résumé et en explorer les articles.");
            $scope.vizTitle = "NAVETTES";
            $rootScope.pageTitle = "";

            $("#navettes-slider").slider({
                min: 1,
                max: 10,
                animate: true,
                value: 1,
                slide: function (event, ui) {
                    thelawfactory.navettes.zooming(ui.value);
                }
            });

            $(".tutorial-button").tooltip();

            update();

            function update() {
                var navettes = thelawfactory.navettes();
                thelawfactory.utils.spinner.start();
                api.getDossiers().then(function (data) {
                    navettes(data, $scope.APIRootUrl, $scope.vizTitle, $scope.helpText);
                }, function () {
                    $scope.display_error("impossible de trouver les données relatives aux textes");
                })
            }
        }
    };
}]);
