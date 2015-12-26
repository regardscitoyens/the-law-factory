'use strict';

angular.module('theLawFactory.directives')
    .directive('mod1', ['$log', '$state',
        function ($log, $state) {
            return {
                restrict: 'E',
                replace: false,
                scope: {
                    loi: '=',
                    lawData: '=',
                    article: '=',
                    currentstep: '=',
                    view: '='
                },
                template: '<div id="viz"><div id="preload"></div></div>',
                link: function (scope, element) {
                    var mod1,
                        onClick = function(article) {
                        if (article) {
                            scope.article = article;
                            $state.go('articles', {loi: article.loi, article: article.article, numeroEtape: article.step_num}, {notify: false});
                        }
                    };

                    scope.$watch('article', function(article) {
                        if (mod1)
                            $(("#art-" + article.step_num + "-" + article.article).replace(/\s/g, '')).d3Click();
                    });

                    scope.$watch('lawData', function (value) {
                        if (!value)
                            return;

                        mod1 = thelawfactory.mod1(scope.currentstep, onClick);
                        d3.select(element[0]).datum(value).call(mod1.vis);

                        if (scope.article)
                            $(("#art-" + scope.article.step_num + "-" + scope.article.article).replace(/\s/g, '')).d3Click();
                    });

                    scope.$watch('view', function (value) {
                        if (!value)
                            return;

                        $log.debug("update mod1 view", value);

                        if (value == 'stacked' && mod1)
                            mod1.stack();

                        if (value == 'valigned' && mod1)
                            mod1.valign();
                    });
                }
            };
        }]);