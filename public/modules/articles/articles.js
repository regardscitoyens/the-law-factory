'use strict';

angular.module('theLawFactory')
.directive('articles', ['$rootScope', '$location', 'api',
function ($rootScope, $location, api) {
    return {
        restrict: 'A',
        replace: false,
        templateUrl: 'modules/articles/articles.html',
        controller: function ($scope) {
            var hasDiff = false;
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

                hasDiff = false;
                if ($scope.revs) {
                    if (d.diffPreview) {
                        $("#sidebar").addClass("has-diff-preview");
                        $diffPreview.html(d.diffPreview).animate({opacity: 1}, 350);

                        hasDiff = true;
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
                if ($cursor) $cursor.remove();

                $cursor = $('<div class="cursor">')
                $diffPreview.append($cursor);

                var startY = null, contentHeight, containerHeight, availableHeight, cursorHeight, startTop, maxTop;

                function cursorDragMove(e) {
                    cursorDragUpdate(e);

                    e.preventDefault();
                }

                function cursorDragStop(e) {
                    cursorDragUpdate(e);

                    startY = null;
                    $(document).off("mousemove touchmove", cursorDragMove);
                    $(document).off("mouseup touchend", cursorDragStop);
                }

                function cursorDragUpdate(e) {
                    var pointer = e.originalEvent && e.originalEvent.changedTouches && e.originalEvent.changedTouches[0] || e;

                    var deltaY = pointer.clientY - startY;
                    var cursorTop = Math.min(maxTop, Math.max(0, startTop + deltaY))

                    $cursor.css({ top: cursorTop + 'px' });
                    $textContainer.scrollTop((contentHeight - availableHeight) * cursorTop / (containerHeight - cursorHeight));
                }

                function cursorDragStart(e, barClicked) {
                    if (startY !== null) return;

                    var pointer = e.originalEvent && e.originalEvent.changedTouches && e.originalEvent.changedTouches[0] || e;
                    startY = pointer.clientY;

                    contentHeight = $(".art-meta").height() + $(".art-txt").height();
                    containerHeight = $textContainer.outerHeight();
                    availableHeight = $textContainer.height();

                    cursorHeight = $cursor.height();
                    startTop = $cursor.position().top;
                    maxTop = containerHeight - cursorHeight;

                    if (barClicked) {
                        var clickY = $(e.target).position().top + e.offsetY;
                        startTop = Math.min(maxTop, Math.max(0, clickY - cursorHeight / 2));

                        $cursor.css({ top: startTop + 'px' });
                        $textContainer.scrollTop((contentHeight - availableHeight) * startTop / (containerHeight - cursorHeight));
                    }

                    $(document).on("mousemove touchmove", cursorDragMove);
                    $(document).on("mouseup touchend", cursorDragStop);

                    e.preventDefault();
                    e.stopPropagation();
                };

                $cursor.on("mousedown touchstart", cursorDragStart);

                if (first) {
                    $diffPreview.on("mousedown touchstart", function(e) {
                        cursorDragStart(e, true);
                    });
                }
            }


            function updateCursor(articleReloaded) {
                if (!hasDiff) return;

                var contentHeight = $(".art-meta").height() + $(".art-txt").height();

                var containerHeight = $textContainer.outerHeight();
                var availableHeight = $textContainer.height();

                if (contentHeight < availableHeight) {
                    $("#sidebar").removeClass("has-diff-preview");
                } else {
                    $("#sidebar").addClass("has-diff-preview");
                }

                var scrollTop = $textContainer.scrollTop();
                var cursorHeight = containerHeight * availableHeight / contentHeight;
                var cursorTop = Math.min(containerHeight - cursorHeight, containerHeight * scrollTop / contentHeight);

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

            $scope.$on('$locationChangeSuccess', function(event, newUrl, oldUrl){
                var parser = document.createElement('a');
                parser.href = newUrl;
                if (parser.pathname.endsWith('/articles.html')) {
                    // TODO watch variable / update $scope in different loop
                    $scope.etape = $location.search()['etape'];
                    $scope.article = $location.search()['article'];
                    $scope.compacte = $location.search()['compacte'] === true;

                    thelawfactory.articles.update();
                }
            });

            $scope.$watch("read", function() {
                setTimeout(updateCursor, 500);
            });
        }
    };
}]);
