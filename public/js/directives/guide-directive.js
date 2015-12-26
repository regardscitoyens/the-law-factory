'use strict';

angular.module('theLawFactory.directives')
    .directive('guide', ['$log', '$timeout', 'usSpinnerService',
        function ($log, $timeout, usSpinnerService) {
            return {
                restrict: 'E',
                replace: false,
                scope: {
                    article: '=',
                    textArticles: '=',
                    lawData: '='
                },
                templateUrl: 'templates/guide.html',
                link: function (scope) {
                    scope.articleTitle = "ARTICLES";
                    scope.helpText = "Chaque boîte représente un article dont la taille indique la longueur du texte et la couleur le degré de modifications à cette étape. Cliquez sur un article pour lire le texte et voir le détail des modifications.";
                    scope.diffMode = true;
                    scope.readMode = false;
                    scope.spin = false;

                    var dmp = new diff_match_patch();
                    dmp.Diff_Timeout = 5;
                    dmp.Diff_EditCost = 25;

                    scope.$watchGroup(['article', 'textArticles'], function(values) {
                        var article = values[0], textArticles = values[1];

                        if (!article || !textArticles)
                            return;

                        usSpinnerService.spin("guide");
                        scope.spin = true;

                        $timeout(function() {
                            showDiff(article);
                            usSpinnerService.stop("guide");
                            scope.spin = false;
                        }, 0);
                    });

                    function showDiff(article) {
                        $log.debug("show diff of article", article);

                        scope.articleTitle = thelawfactory.utils.titre_article(article, 2);
                        scope.textDesc = thelawfactory.utils.getArticleDesc(scope.lawData.sections, article, scope.readMode);

                        var currentVersion = scope.textArticles[article.article][article.directory],
                            prevVersion = scope.textArticles[article.article][article.prev_dir];

                        scope.originalText = thelawfactory.utils.getOriginalText(article, currentVersion);

                        if (prevVersion) {
                            var diff = dmp.diff_main(prevVersion.join("\n"), currentVersion.join("\n"));
                            dmp.diff_cleanupEfficiency(diff);
                            scope.textDiff = thelawfactory.utils.diff_to_html(diff);
                        } else {
                            scope.textDiff = scope.originalText;
                        }
                    }
                },
                controller: ['$scope', function ($scope) {
                    $scope.readmode = function () {
                        $(".text").css({"width": "93.43%", "left": "3.3%"});
                        $scope.readMode = true;
                    };

                    $scope.viewmode = function () {
                        $(".text").css({"width": "23.40%", "left": "73.3%"});
                        $scope.readMode = false;
                    };

                    $scope.hiderevs = function () {
                        $scope.diffMode = false;
                    };

                    $scope.showrevs = function () {
                        $scope.diffMode = true;
                    };
                }]
            };
        }]);