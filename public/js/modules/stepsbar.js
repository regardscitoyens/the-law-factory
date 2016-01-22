angular.module('theLawFactory.stepsbar', [])
    .directive('stepsbar', ['$timeout', '$rootScope', 'api', function ($timeout, $rootScope, api) {
            return {
                restrict: 'A',
                replace: false,
                templateUrl: 'templates/stepsbar.html',
                link: function (scope) {
                    scope.total = 0;
                    api.getProcedure(scope.loi).then(function (data) {

                        var tit = thelawfactory.utils.upperFirst(data.long_title),
                            leg = "";
                        if (tit.length > 60) {
                            leg = ' data-toggle="tooltip" data-placement="right" title="' + tit + '"';
                            tit = scope.loi.substr(0, 3).toUpperCase() + " " + thelawfactory.utils.upperFirst(data.short_title);
                        }
                        $(".title").html(
                            '<h4 class="law-title"' + leg + '>' + tit + '</h4>' +
                            '<div class="allinks darkonintrojs"><span class="links">' +
                            (data.url_jo ? '<a href="' + data.url_jo + '" target="_blank" class="darkonintrojs"><span class="glyphicon glyphicon-link"></span> Loi sur Légifrance</a><br/>' : '') +
                            '<a href="' + scope.APIRootUrl + scope.loi + '/" target="_blank" class="darkonintrojs"><span class="glyphicon glyphicon-link"></span> Open Data</a>' +
                            (data.url_jo ? '&nbsp; /<a href="http://git.lafabriquedelaloi.fr/parlement/' + scope.loi+'/" target="_blank" class="darkonintrojs">Git</a>' : '') +
                            '</span><span class="links">' +
                            (data.url_dossier_senat ? '<a href="'+data.url_dossier_senat+'" target="_blank" class="darkonintrojs"><span class="glyphicon glyphicon-link"></span> Dossier Sénat</a>' : '') +
                            (data.url_dossier_senat && data.url_dossier_assemblee ? '<br/>' : '') +
                            (data.url_dossier_assemblee ? '<a href="' + data.url_dossier_assemblee + '" target="_blank" class="darkonintrojs"><span class="glyphicon glyphicon-link"></span> Dossier Assemblée</a>' : '') +
                            '</span></div>'
                        );
                        if (leg) $(".law-title").tooltip();

                        scope.stages = [];
                        scope.steps = [];
                        scope.inst = [];
                        var currStage = {name: "", num: 1},
                            currInst = {name: "", num: 1};
                        if (!$rootScope.lawTitle) {
                            $rootScope.lawTitle = data.short_title;
                            $rootScope.pageTitle = ($rootScope.pageTitle + "").replace('undefined', $rootScope.lawTitle);
                        }

                        data.steps.forEach(function (e) {
                            if (e.debats_order !== null) scope.total++;
                        });
                        scope.barwidth = $("#stepsbar").width();

                        data.steps.filter(function (e) {
                            return e.debats_order != null;
                        })
                            .sort(function (a, b) {
                                return a.debats_order - b.debats_order;
                            })
                            .forEach(function (e) {
                                scope.steps.push(e);
                                e.short_name = stepLabel(e);
                                e.long_name = stepLegend(e);
                                e.display_short = (scope.barwidth / scope.total < (e.step == "depot" && e.auteur_depot != "Gouvernement" ? 150 : 120));

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

                                if ((e.step === "depot" && currInst.name === e.auteur_depot) || (e.step !== "depot" && e.institution === currInst.name))
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
                            $(".stb-step span").tooltip({html: true});
                            $(".stb-step a").tooltip({html: true});
                            $(".stb-inst span").tooltip();
                            $(".stb-stage span").tooltip({html: true});
                        }, 0);

                    }, function () {
                        scope.display_error("impossible de trouver la procédure de ce texte");
                    });

                    function addStageInst (currObj) {
                        var obj = $.extend(true, {}, currObj);
                        obj.long_name = thelawfactory.utils.getLongName(obj.name);
                        obj.short_name = thelawfactory.utils.getShortName(obj.name);
                        obj.display_short = (obj.long_name != obj.short_name && scope.barwidth * obj.num / scope.total < (obj.name === "CMP" ? 190 : 130));
                        return obj;
                    }

                    function stepLegend (el) {
                        if (el.step === "depot") return (el.auteur_depot == "Gouvernement" ? "Projet de Loi" : "Proposition de Loi");
                        else return thelawfactory.utils.getLongName(el.step);
                    }

                    function stepLabel (el) {
                        if (el.step === "depot") return (el.auteur_depot == "Gouvernement" ? "PJL" : "PPL");
                        return thelawfactory.utils.getShortName(el.step);
                    }
                }
            }
        }
    ]);