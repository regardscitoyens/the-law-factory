'use strict';

angular.module('theLawFactory.directives')
    .directive('stepsbar', ['$log', '$timeout',
        function ($log, $timeout) {
            return {
                restrict: 'E',
                replace: false,
                templateUrl: 'templates/stepsbar.html',
                scope: {
                    loi: "=",
                    procedureData: '='
                },
                link: function(scope) {
                    var utils = thelawfactory.utils;

                    scope.$watch("procedureData", function(data) {
                        if (!data)
                            return;

                        scope.total = 0;
                        scope.steps = [];
                        scope.stages = [];
                        scope.inst = [];

                        var currStage = {name: "", num: 1},
                            currInst = {name: "", num: 1};

                        data.steps.forEach(function (e, j) {
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
                                e.short_name = utils.stepLabel(e);
                                e.long_name = utils.stepLegend(e);
                                e.display_short = (scope.barwidth / scope.total < (e.step == "depot" && e.auteur_depot != "Gouvernement" ? 150 : 120));

                                if (e.step === "depot") {
                                    if (currStage.name) currStage.num++;
                                    else currStage.name = "depot";
                                    if (currStage.num == 2) currStage.name += "s";
                                } else if (currStage.name === e.stage) {
                                    currStage.num++;
                                } else {
                                    if (currStage.name)
                                        scope.stages.push(utils.addStageInst(currStage));
                                    currStage.num = 1;
                                    currStage.name = e.stage;
                                }

                                if ((e.step === "depot" && currInst.name === e.auteur_depot) || (e.step !== "depot" && e.institution === currInst.name))
                                    currInst.num++;
                                else {
                                    if (currInst.name)
                                        scope.inst.push(utils.addStageInst(currInst));
                                    currInst.num = 1;
                                    currInst.name = (e.step === "depot" ? e.auteur_depot : e.institution);
                                }

                                scope.steps.push(e);
                            });

                        scope.stages.push(utils.addStageInst(currStage));
                        scope.inst.push(utils.addStageInst(currInst));
                        $timeout(function () {
                            $(".stb-step span").tooltip({html: true});
                            $(".stb-step a").tooltip({html: true});
                            $(".stb-inst span").tooltip();
                            $(".stb-stage span").tooltip({html: true});
                        }, 0);
                    });
                }
            }
        }
    ]);