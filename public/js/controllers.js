'use strict';

/* Controllers */

angular.module('theLawFactory.controllers', []).
    controller('mainCtrl', function ($scope, $http, apiService, $rootScope, $location) {

        $scope.error = {}
        $scope.statsUrl = 'http://www.lafabriquedelaloi.fr/api/stats_dossiers.json'
        $scope.dataSample = {}

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

        $scope.shortNames = {
            "1ère lecture": "1<sup>ère</sup> Lect.",
            "2ème lecture": "2<sup>ère</sup> Lect.",
            "nouv. lect.": "Nouv. Lect.",
            "l. définitive": "L. Définitive",
            "assemblee": "AN",
            "assemblée nationale": "AN",
            "gouvernement": "Gouv.",
            "commission": "Com.",
            "hemicycle": "Hém.",
            "depots": "Dépôts",
            "depot": "Dépôt",
            "senat": "Sénat",
            "sénat": "Sénat"
        }

        $scope.longNames = {
            "1ère lecture": "1<sup>ère</sup> Lecture",
            "2ème lecture": "2<sup>ère</sup> Lecture",
            "nouv. lect.": "Nouvelle Lecture",
            "l. définitive": "Lecture Définitive",
            "assemblee": "Assemblée",
            "assemblée nationale": "Assemblée",
            "gouvernement": "Gouvernement",
            "commission": "Commission",
            "hemicycle": "Hémicyle",
            "senat": "Sénat",
            "depots": "Dépôts",
            "depot": "Dépôt",
            "cmp": "Commission Mixte Paritaire"
        }

        $scope.cleanLongName = function (l) {
            return l.replace(/<[^>]*>/, '');
        }
        $scope.findShortName = function (l) {
            return ($scope.shortNames[l.toLowerCase()] ? $scope.shortNames[l.toLowerCase()] : l);
        }
        $scope.findLongName = function (l) {
            return ($scope.longNames[l.toLowerCase()] ? $scope.longNames[l.toLowerCase()] : l);
        }
        $scope.stepLegend = function (el){
            if (el.step==="depot") return (el.auteur_depot == "Gouvernement" ? "Projet de Loi" : "Proposition de Loi");
            else return $scope.findLongName(el.step);
        }
        $scope.stepLabel = function (el){
            if(el.step==="depot") return (el.auteur_depot == "Gouvernement" ? "PJL" : "PPL");
            else if($scope.total<10) return el.step;
            else return $scope.findShortName(el.step);
        }

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
        }

    })
