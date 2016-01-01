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

        $scope.spinner = null;
        $scope.spinner_opts = {
            lines: 13, // The number of lines to draw
            length: 20, // The length of each line
            width: 10, // The line thickness
            radius: 30, // The radius of the inner circle
            corners: 1, // Corner roundness (0..1)
            rotate: 0, // The rotation offset
            direction: 1, // 1: clockwise, -1: counterclockwise
            color: '#bbb', // #rgb or #rrggbb or array of colors
            speed: 1, // Rounds per second
            trail: 60, // Afterglow percentage
            shadow: false, // Whether to render a shadow
            hwaccel: false, // Whether to use hardware acceleration
            className: 'spinner', // The CSS class to assign to the spinner
            zIndex: 2e9, // The z-index (defaults to 2000000000)
            top: '50%', // Top position relative to parent
            left: '50%' // Left position relative to parent
        };

        $scope.startSpinner = function (divid) {
            if ($scope.spinner != null) return;
            if (!divid) divid = 'preload';
            var target = document.getElementById(divid);
            $scope.spinner = new Spinner($scope.spinner_opts);
            $('#' + divid).animate({opacity: 1}, 0, function () {
                $scope.spinner.spin(target);
            });
        };
        $scope.stopSpinner = function (callback, divid) {
            if ($scope.spinner == null) return (callback ? callback() : undefined);
            if (!divid) divid = 'preload';
            $('#' + divid).animate({opacity: 0}, 0, function () {
                $scope.spinner.stop();
                $scope.spinner = null;
                return (callback ? callback() : undefined);
            });
        };

        $scope.vizTitle = "";
        $scope.helpText = '<div id="help-msg"><p>VIZTEXT</p><p>Cliquez sur le bouton <span class="question_mark">?</span> ci-dessus pour voir un tutoriel interactif de cette visualisation.<p></div>';
        $scope.setHelpText = function (t) {
            $scope.helpText = $scope.helpText.replace("VIZTEXT", t);
        };

        $scope.clean_amd_subject = function (s) {
            return s.replace(/ART[\.\s]+/i, "Article ")
                .replace(/A(vant|près) A/i, "A$1 l'A");
        };

        $scope.slugArticle = function (a) {
            return "art_" + a.toLowerCase()
                    .replace("è", "e")
                    .replace(/article/, '')
                    .replace(/[i1]er?/, '1')
                    .trim()
                    .replace(/\W/g, '-')
        };

        $scope.string_to_slug = function (str) {
            str = str.replace(/^\s+|\s+$/g, ''); // trim
            str = str.toLowerCase();

            // remove accents, swap ñ for n, etc
            var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
            var to = "aaaaeeeeiiiioooouuuunc------";
            for (var i = 0, l = from.length; i < l; i++) {
                str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
            }

            str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
                .replace(/\s+/g, '-') // collapse whitespace and replace by -
                .replace(/-+/g, '-'); // collapse dashes

            return str;
        };

        $scope.shortenString = function (s, n) {
            if (s.length > n) {
                s = s.substr(0, s.indexOf(' ', n - 20)) + "…";
            }
            return s;
        };

        $scope.adjustColor = function (c) {
            var col = d3.hsl(c);
            if (col.s > 0.5) col.s = 0.5;
            if (col.l < 0.7) col.l = 0.7;
            return col;
        };

        $scope.groups = {};

        $scope.drawGroupsLegend = function () {
            var col, type, oncl, ct = 0;
            d3.entries($scope.groups)
                .sort(function (a, b) {
                    return a.value.order - b.value.order;
                })
                .forEach(function (d) {
                    col = $scope.adjustColor(d.value.color);
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
            group = "." + $scope.slugGroup(group);
            d3.selectAll("path" + group).transition(50).style("fill-opacity", 0.6);
            d3.selectAll("rect" + group).transition(50).style("opacity", 0.9);
            d3.selectAll("path:not(" + group + ")").transition(50).style("fill-opacity", 0.2);
            d3.selectAll("rect:not(" + group + ")").transition(50).style("opacity", 0.2);
        };

        $scope.slugGroup = function (group) {
            return "g_" + group.replace(/[^a-z]/ig, '');
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

        $scope.goodRound = function (n) {
            if (n && Math.abs(n) < 1)
                return parseFloat(n).toFixed(2).replace('.', ',');
            return parseInt(n);
        };
    });
