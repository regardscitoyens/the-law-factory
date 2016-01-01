'use strict';

/* Workaround to trigger click on d3 element */
jQuery.fn.d3Click = function () {
    this.each(function (i, e) {
        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        e.dispatchEvent(evt);
    });
};

/* Controllers */

angular.module('theLawFactory.controllers', ['theLawFactory.config']).
    controller('mainCtrl', function ($timeout, $scope, $http, apiService, api, $rootScope, $location) {
        $(".introjs-helperLayer").remove();
        $(".introjs-overlay").remove();

        $scope.mod = null;
        $scope.drawing = false;
        $scope.loi = $location.search()['loi'];
        $scope.etape = $location.search()['etape'];
        $scope.article = $location.search()['article'];
        $scope.action = $location.search()['action'];

        $scope.read = false;
        $scope.revs = true;
        $scope.readmode = function () {
            $(".text").css({"width": "93.43%", "left": "3.3%"});
            $(".gotomod").addClass('readmode');
            $scope.read = true;
        };
        $scope.viewmode = function () {
            $(".text").css({"width": "23.40%", "left": "73.3%"});
            $(".gotomod").removeClass('readmode');
            $scope.read = false;
        };
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

        $scope.vizTitle = "";
        $scope.helpText = '<div id="help-msg"><p>VIZTEXT</p><p>Cliquez sur le bouton <span class="question_mark">?</span> ci-dessus pour voir un tutoriel interactif de cette visualisation.<p></div>';
        $scope.setHelpText = function (t) {
            $scope.helpText = $scope.helpText.replace("VIZTEXT", t);
        };

        $scope.groups = {};

        $scope.drawGroupsLegend = function () {
            var col, type, oncl, ct = 0;
            d3.entries($scope.groups)
                .sort(function (a, b) {
                    return a.value.order - b.value.order;
                })
                .forEach(function (d) {
                    col = thelawfactory.utils.adjustColor(d.value.color);
                    type = (d.value.link !== "" ? 'colors' : 'others');
                    oncl = ' onclick="highlight(\'' + d.key + '\');" title="' + d.value.nom + '" data-toggle="tooltip" data-placement="left">';
                    $("." + type).append('<div class="leg-item"><div ' + (ct == 3 ? ' id="tuto-legend"' : '') + 'class="leg-value" style="background-color:' + col + '"' + oncl + '</div>' +
                        '<div class="leg-key"' + oncl + d.key + '</div></div>');
                    ct++;
                });
            $(".leg-value").tooltip();
            $(".leg-key").tooltip();
        };

        $scope.highlightGroup = function (group) {
            if (!e) var e = window.event;
            if (e) {
                e.cancelBubble = true;
                if (e.stopPropagation) e.stopPropagation();
            }
            if (!$('.focused')) {
                $(".text-container").empty().html($scope.helpText);
                if ($scope.groups[group]) $("#text-title").html($scope.groups[group].nom);
            }
            $(".legend").on("click", $scope.resetHighlight);
            group = "." + thelawfactory.utils.slugGroup(group);
            d3.selectAll("path" + group).transition(50).style("fill-opacity", 0.6);
            d3.selectAll("rect" + group).transition(50).style("opacity", 0.9);
            d3.selectAll("path:not(" + group + ")").transition(50).style("fill-opacity", 0.2);
            d3.selectAll("rect:not(" + group + ")").transition(50).style("opacity", 0.2);
        };

        $scope.resetHighlight = function () {
            if (!e) var e = window.event;
            if (e) {
                e.cancelBubble = true;
                if (e.stopPropagation) e.stopPropagation();
            }
            if ($('.focused').length) {
                d3.selectAll("rect.focused").transition(50).style("opacity", 0.55);
                d3.selectAll("path.focused").transition(50).style("fill-opacity", 0.45);
                d3.selectAll("rect.main-focused").transition(50).style("opacity", 1);
                d3.selectAll("rect:not(.focused)").transition(50).style("opacity", 0.2);
                d3.selectAll("path:not(.focused)").transition(50).style("fill-opacity", 0.2);
            } else {
                $(".text-container").empty().html($scope.helpText);
                $("#text-title").html($scope.vizTitle);
                d3.selectAll("rect").transition(50).style("opacity", 0.9);
                d3.selectAll("path").transition(50).style("fill-opacity", 0.3);
            }
            d3.selectAll(".actv-amd")
                .style("stroke", "none")
                .classed("actv-amd", false);
        };
    });
