'use strict';

angular.module('theLawFactory')
    .directive('movescroll', function () {
        return {
            restrict: 'A',
            controller: function ($scope) {
                $scope.pos = [-1, -1];
                $scope.xmouselerp = d3.scale.linear().range([-100, 0, 0, 100]).clamp(true);
                $scope.ymouselerp = d3.scale.linear().range([-100, 0, 0, 100]).clamp(true);
            },
            link: function postLink(scope, element) {

                scope.xmouselerp.domain([0, element.width() * 0.2, element.width() * 0.8, element.width()]);
                scope.ymouselerp.domain([0, element.height() * 0.2, element.height() * 0.8, element.height()]);

                var clicking = false;
                var inpos = [-1, -1];
                // No dragging in the borders because of issues with the overflow scollbar
                var gantt_o = $('#gantt').offset(),
                    mouse_xmax = gantt_o.left + $('#gantt').width() - 20,
                    mouse_ymax = gantt_o.top + $('#gantt').height() - 20;

                element.mousedown(function (e) {
                    if (e.pageX > mouse_xmax || e.pageY > mouse_ymax)
                        return;
                    clicking = true;
                    inpos[0] = e.pageX;
                    inpos[1] = e.pageY;
                });

                $(document).mouseup(function () {
                    clicking = false;
                    inpos = [-1, -1];
                });

                element.mousemove(function (e) {
                    if (clicking == false) return;
                    e.stopPropagation();
                    var x = (e.pageX - inpos[0]) * 2;
                    var y = (e.pageY - inpos[1]) * 2;
                    element.scrollTop(element.scrollTop() - y);
                    element.scrollLeft(element.scrollLeft() - x);
                    inpos[0] = e.pageX;
                    inpos[1] = e.pageY;
                });
            }
        };
    });