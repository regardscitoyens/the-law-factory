'use strict';

angular.module('theLawFactory')
.directive('articles', ['$rootScope', 'api',
function ($rootScope, api) {
    return {
        restrict: 'A',
        replace: false,
        templateUrl: 'modules/articles/articles.html',
        controller: function ($scope) {
            var vMargins = 26;
            var $textContainer = $(".text-container");
            var $diffPreview = $(".diff-preview");
            var $cursor;

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
                $rootScope.lawTitle = thelawfactory.utils.niceLawName(data);
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
                    if (d.diffPreview) {
                        $("#sidebar").addClass("has-diff-preview");
                        $diffPreview.html(d.diffPreview).animate({opacity: 1}, 350);

                        setTimeout(function() { updateCursor(true); }, 0);
                    } else {
                        $("#sidebar").removeClass("has-diff-preview");
                    }

                    $(".art-txt").html(d.textDiff).animate({opacity: 1}, 350);
                } else {
                    $("#sidebar").removeClass("has-diff-preview");
                    $(".art-txt").html(d.originalText).animate({opacity: 1}, 350);
                }
                $(".art-txt table").attr("class", "table table-bordered table-striped");
            };


            function initCursor() {
                var first = !$cursor;

                $cursor = $('<div class="cursor">')
                $diffPreview.append($cursor);

                var startY, contentHeight, containerHeight, availableHeight, cursorHeight, startTop, maxTop;

                function cursorDragMove(e) {
                    cursorDragUpdate(e);

                    e.preventDefault();
                }

                function cursorDragStop(e) {
                    cursorDragUpdate(e);

                    $(document).off("mousemove", cursorDragMove);
                    $(document).off("mouseup", cursorDragStop);
                }

                function cursorDragUpdate(e) {
                    var deltaY = e.clientY - startY;
                    var cursorTop = Math.min(maxTop, Math.max(0, startTop + deltaY))

                    $cursor.css({ top: cursorTop + 'px' });
                    $textContainer.scrollTop((contentHeight - availableHeight) * cursorTop / (containerHeight - cursorHeight));
                }

                function cursorDragStart(e, barClicked) {
                    startY = e.clientY;

                    contentHeight = $(".art-meta").height() + $(".art-txt").height() + vMargins;
                    containerHeight = $textContainer.height() + vMargins;
                    availableHeight = containerHeight - vMargins;

                    cursorHeight = $cursor.height();
                    startTop = $cursor.position().top;
                    maxTop = containerHeight - cursorHeight;

                    if (barClicked) {
                        var clickY = $(e.target).position().top + e.offsetY;
                        startTop = Math.min(maxTop, Math.max(0, clickY - cursorHeight / 2));

                        $cursor.css({ top: startTop + 'px' });
                        $textContainer.scrollTop((contentHeight - availableHeight) * startTop / (containerHeight - cursorHeight));
                    }

                    $(document).on("mousemove", cursorDragMove);
                    $(document).on("mouseup", cursorDragStop);

                    e.preventDefault();
                    e.stopPropagation();
                };

                $cursor.on("mousedown", cursorDragStart);

                if (first) {
                    $diffPreview.on("mousedown", function(e) {
                        cursorDragStart(e, true);
                    });
                }
            }


            function updateCursor(articleReloaded) {
                var contentHeight = $(".art-meta").height() + $(".art-txt").height() + vMargins;

                var containerHeight = $textContainer.height() + vMargins;
                var availableHeight = containerHeight - vMargins;

                var scrollTop = $textContainer.scrollTop();
                var cursorHeight = containerHeight * availableHeight / contentHeight;
                var cursorTop = (containerHeight - cursorHeight) * scrollTop / (contentHeight - availableHeight);

                if (!$cursor || articleReloaded === true) {
                    initCursor();
                }

                $cursor.css({
                    height: cursorHeight + 'px',
                    top: cursorTop + 'px'
                });
            }


            $textContainer.on("scroll", updateCursor);
            $(window).on("resize", updateCursor);
        }
    };
}]);
