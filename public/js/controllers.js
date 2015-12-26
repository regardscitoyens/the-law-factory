'use strict';

/* Workaround to trigger click on d3 element */
jQuery.fn.d3Click = function () {
    this.each(function (i, e) {
        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        e.dispatchEvent(evt);
    });
};

angular.module('theLawFactory.controllers', ['angularSpinner', 'theLawFactory.config'])
    .controller('mod1Ctrl', function($log, $http, $rootScope, $location, $scope, api) {
        $rootScope.loi = $location.search()['loi'];

        var articleId = $location.search()['article'],
            stepNum = +$location.search()['numeroEtape'];

        $scope.viz = {
            view: 'stacked'
        };

        api.getProcedure($scope.loi).then(function (procedureData) {
            $log.debug("procedure loaded", procedureData);
            $rootScope.procedureData = procedureData;
            $rootScope.lawTitle = procedureData.short_title;
            $rootScope.pageTitle = $rootScope.lawTitle + " - Articles | ";
            $scope.currentstep = (procedureData.steps && !procedureData.steps[procedureData.steps.length-1].enddate ? procedureData.steps[procedureData.steps.length-1] : undefined);
        });

        api.getArticle($scope.loi).then(function (lawData) {
            $log.debug("law loaded", lawData);

            $scope.lawData = lawData;

            if (articleId && stepNum) {
                $scope.article = lawData.articles[articleId].steps[stepNum];
            }

            api.getTextArticles($scope.loi, lawData.directories).then(function(textArticles) {
                $log.debug("text loaded", textArticles);
                $scope.textArticles = textArticles;
            });

        }, function (error) {
            $log.error(error);
            $scope.display_error("impossible de trouver les articles de ce texte");
        });
    })
    .controller('mainCtrl', function ($scope, $log, $http, apiService, api, $rootScope, $location, $timeout) {
        $scope.loi = $location.search()['loi'];
        $scope.etape = $location.search()['etape'];
        $scope.article = $location.search()['article'];
        $scope.action = $location.search()['action'];

        $scope.mod = null;
        $scope.drawing = false;
        $scope.read = false;
        $scope.revs = true;
        $scope.vizTitle = "";
        $scope.helpText = "";
        $scope.groups = {};
        $scope.steps = [];

        $scope.toggleTutorial = function () {
            if (!$scope.tutorial) {
                $scope.tutorial = true;
                api.getTutorials().then(function (data) {
                        var introjs = thelawfactory.utils.getIntroJs(data, $scope.mod);

                        $timeout(function() {
                            introjs.start();
                        }, 0);
                    },
                    function () {
                        $log.error("couldn't retrieve json tutorial");
                    }
                );
            }
        };

        $scope.showFirstTimeTutorial = function () {
            $('#menu-tutorial span').tooltip();
            if (!localStorage.getItem("tuto-" + $scope.mod) || localStorage.getItem("tuto-" + $scope.mod) != "done")
                $scope.toggleTutorial();
        }
    }
);
