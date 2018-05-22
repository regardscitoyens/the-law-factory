'use strict';

angular.module('theLawFactory')
.directive('stepsbar', ['$timeout', '$rootScope', 'api',
function ($timeout, $rootScope, api) {
    return {
        restrict: 'A',
        replace: false,
        templateUrl: 'modules/stepsbar/stepsbar.html',
        link: function (scope) {
            scope.total = 0;
            api.getProcedure(scope.loi).then(function (data) {

                var tit = thelawfactory.utils.upperFirst(data.long_title),
                    leg = "";
                if (tit.length > 60) {
                    leg = ' data-toggle="tooltip" data-placement="top" title="' + tit + '"';
                    tit = scope.loi.substr(0, 3).toUpperCase() + " " + thelawfactory.utils.niceLawName(data);
                }
                $(".title").html(
                    '<h4 class="law-title"' + leg + '>' +
                    tit + '</h4>' +
                    '<span class="allinks"><span class="links darkonintrojs">' +
                    (data.url_dossier_senat ? '<a href="'+data.url_dossier_senat+'" target="_blank" class="darkonintrojs"><span class="glyphicon glyphicon-link"></span> Dossier Sénat</a><br/>' : '&nbsp;<br/>') +
                    (data.url_dossier_assemblee ? '<a href="' + data.url_dossier_assemblee + '" target="_blank" class="darkonintrojs"><span class="glyphicon glyphicon-link"></span> Dossier Assemblée</a>' : '') +
                    '</span><span class="links darkonintrojs">' +
                    (data.url_jo ? '<a href="' + data.url_jo + '" target="_blank" class="darkonintrojs"><span class="glyphicon glyphicon-link"></span> Loi sur Légifrance</a><br/>' : '&nbsp;<br/>') +
                    '<a href="' + scope.APIRootUrl + scope.loi + '/" target="_blank" class="darkonintrojs"><span class="glyphicon glyphicon-link"></span> Open Data</a>' +
                    //(data.url_jo ? '&nbsp;/&nbsp;<a href="http://git.lafabriquedelaloi.fr/parlement/' + scope.loi+'/" target="_blank" class="darkonintrojs">Git</a>' : '') +
                    '</span></span>'
                );
                if (leg) $(".law-title").tooltip({ container: 'body' });
                $(".tutorial-button").tooltip();

                scope.stages = [];
                scope.steps = [];
                scope.inst = [];
                var currStage = {name: "", num: 1},
                    currInst = {name: "", num: 1};
                if (!$rootScope.lawTitle) {
                    $rootScope.lawTitle = thelawfactory.utils.niceLawName(data);
                    $rootScope.pageTitle = ($rootScope.pageTitle + "").replace('undefined', $rootScope.lawTitle);
                }

                data.steps.forEach(function (e) {
                    if (e.debats_order !== null) scope.total++;
                });
                scope.barwidth = $("#stepsbar").width();

                var displayedSteps = data.steps.filter(function (e) {
                    return e.debats_order != null;
                })
                .sort(function (a, b) {
                    return a.debats_order - b.debats_order;
                });

                createShortLabelsStylesheet(displayedSteps.length, 150, '*');
                createShortLabelsStylesheet(displayedSteps.length, 190, '.cmp');

                displayedSteps.forEach(function (e) {
                    scope.steps.push(e);
                    e.short_name = stepLabel(e);
                    e.long_name = stepLegend(e);

                    if (e.step === "depot") {
                        if (currStage.name) currStage.num++;
                        else currStage.name = "depot";
                        if (currStage.num == 2) currStage.name += "s";
                    } else if (currStage.name === e.stage) {
                        currStage.num++;
                    } else {
                        if (currStage.name)
                            scope.stages.push(addStageInst(currStage));
                        currStage.num = 1;
                        currStage.name = e.stage;
                    }
                    currStage.urgence = data.urgence && /^1/.test(currStage.name);

                    if (currStage.num !== 1 && ((e.step === "depot" && currInst.name === e.auteur_depot) || (e.step !== "depot" && e.institution === currInst.name)))
                        currInst.num++;
                    else {
                        if (currInst.name)
                            scope.inst.push(addStageInst(currInst));
                        currInst.num = 1;
                        currInst.name = (e.step === "depot" ? e.auteur_depot : e.institution);
                    }
                });

                scope.stages.push(addStageInst(currStage));
                scope.inst.push(addStageInst(currInst));
                $timeout(function () {
                    $(".stb-step span").tooltip({html: true, container:'body'});
                    $(".stb-step a").tooltip({html: true, container:'body'});
                    $(".stb-inst span").tooltip({container:'body'});
                    $(".stb-stage span").tooltip({html: true, container:'body'});
                }, 0);

            }, function () {
                // detect if the law has a new ID and redirect to the new page
                $rootScope.$watch('lawlist', function(value) {
                    if (value) {
                        for (var i = 0; i < $rootScope.lawlist.length; i++) {
                            if ($rootScope.lawlist[i].assemblee_id === scope.loi) {
                                window.location.replace(window.location.href.replace(scope.loi, $rootScope.lawlist[i].id));
                                return;
                            }
                        }
                    }
                    scope.display_error("impossible de trouver la procédure de ce texte");
                });
            });

            function addStageInst (currObj) {
                var obj = $.extend(true, {}, currObj);
                obj.long_name = thelawfactory.utils.getLongName(obj.name);
                obj.short_name = thelawfactory.utils.getShortName(obj.name);
                return obj;
            }

            function stepLegend (el) {
                if (el.step === "depot") return (el.auteur_depot == "Gouvernement" ? "Projet de Loi" : "Proposition de Loi");
                if (el.stage === "constitutionnalité") {
                    return thelawfactory.utils.getLongName(el.decision || 'conforme');
                }
                else return thelawfactory.utils.getLongName(el.step);
            }

            function stepLabel (el) {
                if (el.step === "depot") return (el.auteur_depot == "Gouvernement" ? "PJL" : "PPL");
                if (el.stage === "constitutionnalité") {
                    return thelawfactory.utils.getShortName(el.decision || 'conforme');
                }
                return thelawfactory.utils.getShortName(el.step);
            }

            var shortStylesheets = {};
            function createShortLabelsStylesheet(numSteps, maxSize, containerSelector)
            {
                // Compute viewport size such that each step is <maxSize> wide, knowing that there are 39px margins
                // on left & right and the stepsbar takes 75% of the available width
                var widthThreshold = maxSize * numSteps * 4/3 + 2 * 39

                // Set a CSS rule to hide long labels and show short labels when under that threshold
                if (shortStylesheets[containerSelector]) {
                    document.head.removeChild(shortStylesheets[containerSelector]);
                }

                var shortStyle = shortStylesheets[containerSelector] = document.createElement("style");
                shortStyle.setAttribute("media", "screen and (max-width : " + widthThreshold + "px)");
                document.head.appendChild(shortStyle);

                if (containerSelector === '*') containerSelector = '';
                shortStyle.sheet.insertRule("#stepsbar " + containerSelector + " .long-label { display: none; }", 0);
                shortStyle.sheet.insertRule("#stepsbar " + containerSelector + " .short-label { display: block; }", 1);
            }
        }
    }
}]);
