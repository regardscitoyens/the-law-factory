'use strict';

angular.module('theLawFactory')
.directive('amendements', ['$rootScope', '$timeout', '$sce', '$location', 'api',
function ($rootScope, $timeout, $sce, $location, api) {
    return {
        restrict: 'A',
        replace: false,
        templateUrl: 'modules/amendements/amendements.html',
        controller: function ($scope) {
            $scope.step = 0;
            $scope.mod = "amendements";
            $scope.setHelpText("Chaque boîte représente un amendement dont le pictogramme indique le sort et la couleur le groupe politique de ses auteurs. Cliquez sur un amendement pour en lire le contenu et les détails.");
            $scope.trustedHelpText = $sce.trustAsHtml($scope.helpText);
            $scope.vizTitle = "AMENDEMENTS";

            // Permet le focus sur les amendements par groupe ou par sort
            $scope.focusGroupe = null;
            $scope.focusSort = null;

            // Définit le regroupement et le tri des amendements
            $scope.groupAll = false;
            $scope.sortOrder = 'sort';

            // Mode 2 colonnes
            $scope.twoColumnMode = false;

            // Largeur des sujets
            $scope.subjectWidth = 0;

            // Gestion du tooltip amendements
            $scope.hoverAmendement = null;

            // Permet l'affichage du contenu d'un amendement
            $scope.loadingAmdt = false;
            $scope.selectedAmdt = null;
            $scope.selectedAmdtData = null;

            var viz = thelawfactory.amendements,
                firstDraw = true,
                refreshInterval = 60000;

            // Redessine les dernières données de l'API (à appeler sur changement de tri/groupement)
            function redraw() {
                if (!$scope.apiData) return;
                viz.transformData($scope);

                $timeout(function() {
                    resize();

                    if ($scope.selectedAmdt) {
                        $('.amendement-' + $scope.selectedAmdt.id_api).addClass('selected');
                    }

                    if (firstDraw) {
                        var $focus = $('.sujet.focus');
                        var $viz = $('#viz');

                        if ($focus.length) {
                            $viz.animate({
                                scrollTop: $focus.offset().top - $viz.offset().top
                            });
                        }

                        var amdtNum = $location.search()['amdt'];
                        if (amdtNum) {
                            var $amdt = $('.amendement-num-' + amdtNum);
                            var $sujet = $amdt.parents('.sujet');

                            $amdt.click();
                            $viz.animate({
                                scrollTop: $sujet.offset().top - $viz.offset().top
                            });
                        }

                        firstDraw = false;
                    }
                }, 0);
            }

            // Redimensionne les conteneurs
            function resize() {
                thelawfactory.utils.setModSize("#viz", 1)();
                thelawfactory.utils.setTextContainerHeight();
                viz.measureViewportSize();
            }

            // Lit les données depuis l'API et déclenche le redessin
            function update() {
                if ($scope.etape != null) {
                    // Anime l'icône "live"
                    var started = Date.now();
                    $rootScope.reloading = true;

                    api.getAmendement($scope.loi, $scope.etape)
                    .then(function (data) {
                        thelawfactory.utils.spinner.stop();
                        $scope.apiData = data;
                        $rootScope.pageTitle = $rootScope.lawTitle + " - Amendements | ";

                        // Active l'autorefresh si step en cours
                        $scope.$watch('steps', function(steps) {
                            if (!steps) return;

                            var step = steps.filter(function(s) { return s.directory === $scope.etape; })[0];

                            if (step && step.enddate === "") {
                                $timeout(update, refreshInterval);
                            }
                        });

                        // Attend que l'animation ait au moins duré 1s
                        $timeout(function() {
                            $rootScope.reloading = false;
                        }, Math.max(0, 1000 - (Date.now() - started)));
                    }, function () {
                        $scope.display_error("impossible de trouver les amendements pour ce texte à cette étape");
                    });
                }
            }

            // Affichage du contenu d'un amendement
            $scope.selectAmdt = function(amdt) {
                $('.amendements .amendement.selected').removeClass('selected');

                if (amdt) {
                    $('.amendement-' + amdt.id_api).addClass('selected');

                    thelawfactory.utils.setTextContainerHeight();
                    thelawfactory.utils.spinner.start('load_amd');

                    $scope.loadingAmdt = true;

                    api.getAmendementContent($scope.apiData.api_root_url, amdt.id_api)
                    .then(function(data) {
                        var amdtContenu = data.amendement;

                        amdtContenu.sujet = thelawfactory.utils.cleanAmdSubject(amdtContenu.sujet);
                        amdtContenu.origine = amdtContenu.url_nosdeputes ? 'an' : 'senat';
                        amdtContenu.url = amdtContenu.url_nosdeputes || amdtContenu.url_nossenateurs;

                        $location.search('amdt', amdt.numero);
                        amdtContenu.tlfurl = $location.absUrl();

                        amdtContenu.trustedExpose = $sce.trustAsHtml(amdtContenu.expose);
                        amdtContenu.trustedTexte = $sce.trustAsHtml(amdtContenu.texte);

                        $scope.loadingAmdt = false;
                        $scope.selectedAmdt = amdt;
                        $scope.selectedAmdtData = amdtContenu;

                        thelawfactory.utils.spinner.stop(function () {
                            $('.text-container').scrollTop(0);
                        }, 'load_amd');
                    }, function() {
                        thelawfactory.utils.spinner.stop('load_amd');
                        $scope.display_error("impossible de trouver le contenu de cet amendement");
                    });
                }
            };

            // Focus sur un sujet
            $scope.focusSubject = function($event, article) {
                var $target = $($event.target);
                if ($target.hasClass('amendement')) {
                    if ($target.parents('.sujet').attr('data-article') === $scope.article) return;
                }

                if ($scope.article === article) {
                    // Re-clic sur un article = désélection
                    article = null;
                }

                if (!article) {
                    $scope.article = null;
                    $scope.focusGroupe = null;
                    $scope.focusSort = null;
                } else {
                    $event.stopPropagation();
                    $scope.article = article;
                }

                $location.search('article', article);
            };

            // Focus sur un groupe ou sort
            $scope.focusAmendements = function(e, groupe, sort) {
                e.stopPropagation();

                if (groupe) {
                    $scope.focusGroupe = groupe;
                    $scope.focusSort = null;
                } else {
                    $scope.focusGroupe = null;
                    $scope.focusSort = sort;
                }
            };

            // Formatage de date
            $scope.formatDate = function(date) {
                if (!date) return;

                var m = date.match(/(\d{4})-(\d{2})-(\d{2})/);
                if (m) {
                    return m[3] + '/' + m[2] + '/' + m[1];
                } else {
                    return date;
                }
            };

            // Gestion du tooltip d'un amendement
            var hideTimeout;

            $scope.showTooltip = function(idxSujet, idxAmdt) {
                // Annuler une éventuelle tempo de hideTooltip
                $timeout.cancel(hideTimeout);

                var amdt = $scope.data.sujets[idxSujet].amendements_snake[idxAmdt];

                var $amdt = $('.amendement-' + amdt.id_api);
                var offset = $amdt.position();

                var $tip = $('#amendement-tooltip');
                $tip.css({ top: offset.top + 'px', left: offset.left + 'px', opacity: 1 });

                $scope.hoverAmendement = amdt;
            };

            $scope.hideTooltip = function() {
                // Tempo pour éviter un clignotement dans le cas où la souris se balade vite
                hideTimeout = $timeout(function() {
                    var $tip = $('#amendement-tooltip');
                    $tip.css({ opacity: 0 });

                    // Laisser finir l'animation css avant d'effacer le contenu
                    hideTimeout = $timeout(function() {
                        $scope.hoverAmendement = null;
                    }, 250);
                }, 50);
            };

            // Déclencheurs de redessin
            $scope.$watchGroup(['apiData', 'groupAll', 'sortOrder'], redraw);

            // Redimensionnement automatique
            var resizing;
            $(window).on('resize', function() {
                $timeout.cancel(resizing);
                resizing = $timeout(function() {
                    resize();
                    viz.transformData($scope, true);
                    resizing = false;
                }, 200);
            });

            // Appuis claviers
            $(window).on('keydown', function(e) {
                if (!$scope.selectedAmdt) return;

                var $amdt = $('.amendement-' + $scope.selectedAmdt.id_api);
                var $amdts = $('.amendement');
                var index = $amdts.index($amdt);
                var newamdt;

                switch (e.keyCode) {
                    case 37: // gauche
                        if (index > 0) newamdt = $amdts.get(index - 1);
                        break;
                    case 39: // droite
                        if (index < $amdts.length - 1) newamdt = $amdts.get(index + 1);
                        break;
                    case 38: // haut
                    case 40: // bas
                    default:
                        return;
                }

                if (newamdt) {
                    $(newamdt).click();
                }
            });

            // Chargement initial
            var initFinished = $scope.$watch('etape', function() {
                // Arrêt du $watch
                initFinished();

                // Déclenchement de la mise à jour des données
                update();

                // Recalcul des dimensions
                resize();

                // Affichage du spinner
                thelawfactory.utils.spinner.start();
            });
        }
    }
}]);