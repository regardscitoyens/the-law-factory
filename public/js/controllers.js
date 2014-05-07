'use strict';

/* Controllers */

angular.module('theLawFactory.controllers', []).
    controller('mainCtrl', function ($scope, $http, apiService, $rootScope, $location) {

        $scope.go = function (path) {
            console.log($location.path("/" + path + "l=" + $rootScope.l))
            $location.path(path).search("l=" + $rootScope.l);
            //+"l="+$rootScope.l
        };

        $scope.select = function (id) {
            console.log("aaarrhh")
            $rootScope.l = id
            $location.path("mod1").search("l=" + $rootScope.l);
            //+"l="+$rootScope.l
        };

        $scope.error = {}
        $scope.lawlistUrl = 'laws/list'
        $scope.procedureUrl = 'law-procedure/'
        $scope.dataUrl = 'law-article/'
        $scope.amdUrl = 'law-amendments/'
        $scope.intUrl = 'law-interventions/'
        $scope.dossierUrl = 'http://www.lafabriquedelaloi.fr/api/dossiers_0_49.json'
        $scope.statsUrl = 'http://www.lafabriquedelaloi.fr/api/stats_dossiers.json'
        $scope.dataSample = {}


        $scope.shortNames = {
            "assemblee": "AN",
            "assemblée nationale": "AN",
            "gouvernement": "Gouv.",
            "commission": "Com.",
            "hemicycle": "Hem.",
            "depot": "depot",
            "senat": "senat",
            "sénat": "senat"
        }

        $scope.longNames = {
            "assemblee": "assemblée",
            "assemblée nationale": "assemblée",
            "senat": "sénat"
        }

        $scope.findShortName = function (l) {

            var res = null;
            if ($scope.shortNames[l.toLowerCase()]) return $scope.shortNames[l.toLowerCase()];
            else return l;
        }

        $scope.findLongName = function (l) {

            var res = null;
            if ($scope.longNames[l.toLowerCase()]) return $scope.longNames[l.toLowerCase()];
            else return l;
        }

        $scope.stepLabel= function(el){

            if(el.step==="depot") return $scope.l.substr(0,3).toUpperCase();
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
