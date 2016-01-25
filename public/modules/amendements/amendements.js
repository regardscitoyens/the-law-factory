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

            // Permet l'affichage du contenu d'un amendement
            $scope.loadingAmdt = false;
            $scope.selectedAmdt = null;
            $scope.selectedAmdtData = null;

            var sort_ordre = {
                    "adopté": 0,
                    "rejeté": 1,
                    "non-voté": 2,
                    "en attente": 3
                }, sort_image = {
                    "adopté": "img/ok.png",
                    "rejeté": "img/ko.png",
                    "non-voté": "img/nd.png",
                    "en attente": "img/at.png"
                }, tri = {
                    "sort": tri_amdts_sort,
                    "groupe": tri_amdts_groupe
                }, groupes,
                availableWidth,
                firstDraw = true,
                columnsThreshold = 0,
                refreshInterval = 60000;

            function cssColor(col)              { return thelawfactory.utils.adjustColor(col).toString(); }
            function compare_sujets(a, b)       { return a.order - b.order; }
            function compare_groupes(a, b)      { return groupes[a].order - groupes[b].order; }
            function compare_amdts_sort(a, b)   { return sort_ordre[a.sort] - sort_ordre[b.sort]; }
            function compare_amdts_groupe(a, b) { return groupes[a.groupe].order - groupes[b.groupe].order; }
            function compare_amdts_numero(a, b) { return a.numero.replace(/^\D+/, '') - b.numero.replace(/^\D+/, ''); }
            function tri_amdts_sort(a, b)       { return compare_amdts_sort(a, b) || compare_amdts_groupe(a, b) || compare_amdts_numero(a, b); }
            function tri_amdts_groupe(a, b)     { return compare_amdts_groupe(a, b) || compare_amdts_sort(a, b) || compare_amdts_numero(a, b); }

            // Prépare les données de l'API pour rendre le rendu Angular plus simple
            function transformData(apiData) {
                groupes = apiData.groupes;

                var max_amdts = 0;
                var tri_amdts = tri[$scope.sortOrder] || compare_amdts_numero;
                var data = {
                    groupes: groupes,
                    legende: {
                        groupes: {},
                        sorts: {}
                    },
                    sujets: [],
                    colonnes: ''
                };

                if ($scope.groupAll) {
                    // Création d'un sujet unique en cas de groupement
                    data.sujets.push({
                        titre: "Tout le texte",
                        amendements: []
                    });
                }

                // Parcours des sujets
                Object.keys(apiData.sujets)
                .forEach(function(key) {
                    var sujet = apiData.sujets[key];

                    // Extraction numero d'article
                    sujet.article = sujet.details.replace(/^article /, '');

                    // Ajout image et couleur du groupe aux amendements
                    sujet.amendements.forEach(function(amdt) {
                        amdt.sort_image = sort_image[amdt.sort];
                        amdt.color = cssColor(groupes[amdt.groupe].color);
                        amdt.nom_groupe = groupes[amdt.groupe].nom;
                    });

                    if ($scope.groupAll) {
                        // Regroupement de tous les amendements
                        data.sujets[0].amendements = data.sujets[0].amendements.concat(sujet.amendements);
                    } else {
                        max_amdts = Math.max(max_amdts, sujet.amendements.length);

                        // Tri des amendements du sujet
                        sujet.amendements.sort(tri_amdts);

                        // Ajout du sujet à la liste
                        data.sujets.push(sujet);
                    }
                });

                if ($scope.groupAll) {
                    // Tri des amendements
                    data.sujets[0].amendements.sort(tri_amdts);
                } else {
                    // Seuil de bascule en mode 2 colonnes
                    columnsThreshold = 1 + max_amdts * 2;

                    if (columnsThreshold  < availableWidth) {
                        data.colonnes = 'colonnes';
                    }

                    // Tri des sujets
                    data.sujets.sort(compare_sujets);
                }

                // Construction de la légende
                Object.keys(groupes).sort(compare_groupes).forEach(function(key) {
                    groupes[key].cssColor = cssColor(groupes[key].color);

                    if (key !== 'Gouvernement') {
                        data.legende.groupes[key] = groupes[key];
                    }
                });
                data.legende.sorts = sort_image;

                return data;
            }

            // Redessine les dernières données de l'API (à appeler sur changement de tri/groupement)
            function redraw() {
                if (!$scope.apiData) return;
                $scope.data = transformData($scope.apiData);

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

            /* Calcul du nombre d'amendements max en largeur:
             * (Largeur du conteneur - (marge interne horizontale = 50px))
             *   /
             * (taille 1 amendement = 20px)
             */
            function computeAvailableWidth() {
                availableWidth = Math.floor(($('#sujets').width() - 50) / 20);
            }

            // Redimensionne les conteneurs
            function resize() {
                thelawfactory.utils.setModSize("#viz", 1)();
                thelawfactory.utils.setTextContainerHeight();

                computeAvailableWidth();

                // Gestion de la bascule 1 ou 2 colonnes
                if (columnsThreshold !== 0) {
                    if (columnsThreshold < availableWidth && !$scope.groupAll) {
                        $('#viz').addClass('colonnes');
                    } else {
                        $('#viz').removeClass('colonnes');
                    }
                }
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

            // Gère la navigation au clavier
            function keypress(e) {
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
            $scope.focusAmendements = function(groupe, sort) {
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
                var m = date.match(/(\d{4})-(\d{2})-(\d{2})/);
                if (m) {
                    return m[3] + '/' + m[2] + '/' + m[1];
                } else {
                    return date;
                }
            };

            // Repositionnement du tooltip
            $scope.repositionTooltip = function($event) {
                var $amdt = $($event.target);
                var $tip = $amdt.find('.amendement-tooltip');
                var offset = $amdt.position();

                $tip.css({ top: offset.top + 'px', left: offset.left + 'px' });
            };

            // Déclencheurs de redessin
            $scope.$watchGroup(['apiData', 'groupAll', 'sortOrder'], redraw);

            // Redimensionnement automatique
            $(window).on('resize', resize);

            // Appuis claviers
            $(window).on('keydown', keypress);

            // Chargement initial
            var initFinished = $scope.$watch('etape', function() {
                initFinished();
                update();
                resize();
                thelawfactory.utils.spinner.start();
            });
        }
    }
}]);