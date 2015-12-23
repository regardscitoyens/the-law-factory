'use strict';

/* Workaround to trigger click on d3 element */
jQuery.fn.d3Click = function () {
    this.each(function (i, e) {
        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        e.dispatchEvent(evt);
    });
};

angular.module('theLawFactory.controllers', ['theLawFactory.config'])
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
