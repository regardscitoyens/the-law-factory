'use strict';

angular.module('theLawFactory')
.directive('debats', ['api', '$rootScope', '$location', '$compile',
function (api, $rootScope) {
    return {
        restrict: 'A',
        replace: false,
        templateUrl: 'modules/debats/debats.html',
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

            var directions = {
                '37': 'left',
                '38': 'up',
                '39': 'right',
                '40': 'down'
            };

            function handleKeyDown(e) {
                if (!(e.keyCode in directions)) return;

                var newRect = getOffsetRect(directions[e.keyCode]);

                if (newRect && newRect.length) {
                    focusRect.call(newRect[0]);

                    var $viz = $('#viz');
                    var height = $viz.height();
                    var scrollTop = $viz.scrollTop();
                    var viztop = $viz.offset().top;
                    var top = null;

                    if (newRect.attr('x')) {
                        // Visible rect
                        top = newRect.offset().top - viztop;
                    } else {
                        // Invisible rect => use filter-title
                        var x = d3.select(newRect[0]).data()[0].x.replace(/\s+/g, '');
                        var filter = $('text.filter-title').filter(function(index) {
                            return $(this).find('tspan').text().replace(/\s+/g, '') === x;
                        }).get(0);

                        top = $(filter).offset().top - viztop;
                    }

                    if (top != null) {
                        if (top < 20) {
                            $viz.animate({ scrollTop: scrollTop + top - 20 }, { queue: false, duration: 200 });
                        } else if (top + 50 > height) {
                            $viz.animate({ scrollTop: scrollTop + (top + 50 - height) }, { queue: false, duration: 200 });
                        }
                    }
                }

                e.preventDefault();
            }

            $(window).on('keydown', handleKeyDown);

            $scope.$on('$destroy', function() {
                $(window).off('keydown', handleKeyDown);
            });
        }
    };
}]);