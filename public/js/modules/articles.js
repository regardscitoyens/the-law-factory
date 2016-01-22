'use strict';

angular.module('theLawFactory.articles', [])
    .directive('articles', ['$rootScope', 'api', function ($rootScope, api) {
        return {
            restrict: 'A',
            replace: false,
            templateUrl: 'templates/articles.html',
            controller: function ($scope) {
                $scope.mod = "articles";
                $scope.setHelpText("Chaque boîte représente un article dont la taille indique la longueur du texte et la couleur le degré de modifications à cette étape. Cliquez sur un article pour lire le texte et voir le détail des modifications.");
                $scope.vizTitle = "ARTICLES";
                $scope.chronomissing = true;

                // Hack pour cacher le bouton retour chrono quand il marche pas sur les textes en cours
                $rootScope.lawlist = $rootScope.lawlist || [];
                $rootScope.$watch('lawlist', function(value) {
                    if (!value) return;
                    for (var i = 0; i < $rootScope.lawlist.length; i++) {
                        if ($rootScope.lawlist[i].id === $scope.loi) {
                            $scope.chronomissing = false;
                            break;
                        }
                    }
                });

                thelawfactory.utils.spinner.start();

                api.getArticle($scope.loi).then(function (data) {
                    $rootScope.lawTitle = data.short_title;
                    $rootScope.pageTitle = $rootScope.lawTitle + " - Articles | ";
                    $scope.articlesData = data;
                }, function () {
                    $scope.display_error("impossible de trouver les articles de ce texte");
                });

                $scope.$watchGroup(['steps', 'articlesData'], function (values) {
                    if (!values[0] || !values[1]) return;

                    var articles = thelawfactory.articles();
                    $scope.currentstep = ($scope.steps && !$scope.steps[$scope.steps.length - 1].enddate ? $scope.steps[$scope.steps.length - 1] : undefined);
                    articles($scope.articlesData, $scope.APIRootUrl, $scope.loi, $scope.currentstep, $scope.helpText);
                    thelawfactory.utils.spinner.stop();
                });

                $scope.revs = true;

                $scope.hiderevs = function () {
                    $scope.revs = false;
                    return $scope.update_revs_view();
                };

                $scope.showrevs = function () {
                    $scope.revs = true;
                    return $scope.update_revs_view();
                };

                $scope.update_revs_view = function () {
                    var d = d3.select('#viz .curr').data()[0];
                    if ($scope.revs) {
                        $(".art-txt").html(d.textDiff).animate({opacity: 1}, 350);
                    } else {
                        $(".art-txt").html(d.originalText).animate({opacity: 1}, 350);
                    }
                };
            }
        };
    }]);