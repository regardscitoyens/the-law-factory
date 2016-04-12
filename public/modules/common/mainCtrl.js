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

angular.module('theLawFactory')
.controller('mainCtrl',
function ($timeout, $scope, $http, apiService, api, $rootScope, $location) {
    $(".introjs-helperLayer").remove();
    $(".introjs-overlay").remove();

    $scope.loi = $location.search()['loi'];
    $scope.etape = $location.search()['etape'];
    $scope.action = $location.search()['action'];
    $scope.vizTitle = "";
    $scope.helpText = '<div id="help-msg"><p>VIZTEXT</p><p>Cliquez sur le bouton <span class="question_mark">?</span> ci-dessus pour voir un tutoriel interactif de cette visualisation.<p></div>';
    $scope.setHelpText = function (t) {
        $scope.helpText = $scope.helpText.replace("VIZTEXT", t);
    };

    $("body > .tooltip").remove();
});
