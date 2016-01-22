'use strict';

angular.module('theLawFactory.debats', [])
    .directive('debats', ['api', '$rootScope', '$location', '$compile',
        function (api, $rootScope) {
            return {
                restrict: 'A',
                replace: false,
                templateUrl: 'templates/debats.html',
                controller: function ($scope) {
                    $scope.step = 0;
                    $scope.mod = "debats";
                    $scope.setHelpText("Chaque boîte représente un groupe d'orateurs intervenus dans les débats sur un sujet. La longueur indique le nombre de mots prononcés et la couleur le groupe politique. Cliquez sur une boîte pour voir la liste des orateurs et consulter le texte des débats.");
                    $scope.vizTitle = "DÉBATS";

                    update();

                    function update() {
                        thelawfactory.utils.spinner.start();
                        if ($scope.etape != null) {
                            api.getIntervention($scope.loi).then(function (data) {
                                $scope.data = data;
                                $rootScope.pageTitle = $rootScope.lawTitle + " - Débats | ";
                                init(data, $scope.etape, $scope.vizTitle, $scope.helpText);
                            }, function () {
                                $scope.display_error("impossible de trouver les interventions pour ce texte à cette étape");
                            })
                        }
                    }
                }
            };
        }]);