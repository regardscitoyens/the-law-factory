'use strict';

// Default configuration - do not change here
// Configuration id to be set in public/js/config.js
angular.module('theLawFactory.config', []).constant('API_ROOT_URL', 'https://www.lafabriquedelaloi.fr/api/').constant('GOOGLE_ANALYTICS_ID', '').constant('HOST_FOR_GOOGLE', '');

// Declare app level module which depends on filters, and services
angular.module('theLawFactory', [
    'ngSanitize',
    'ui.router',
    'theLawFactory.config',
    'theLawFactory.controllers',
    'theLawFactory.services',
    'theLawFactory.directives',
    'theLawFactory.lawlist',
    'theLawFactory.movescroll',
    'theLawFactory.stepsbar',
    'theLawFactory.navettes',
    'theLawFactory.articles',
    'theLawFactory.debats',
    'theLawFactory.amendements',
    'theLawFactory.analytics'
]).config(function ($locationProvider, $stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('home', {
            url: '/',
            templateUrl: 'templates/home.html',
            controller: 'mainCtrl'
        })
        .state('about', {
            url: '/a-propos.html',
            templateUrl: 'templates/about.html',
            controller: 'mainCtrl'
        })
        .state('laws', {
            url: '/lois.html?loi',
            template: '<div navettes class="navettes"></div>',
            controller: 'mainCtrl'
        })
        .state('articles', {
            url: '/articles.html?loi',
            template: '<div articles read-mode class="articles"></div>',
            controller: 'mainCtrl'
        })
        .state('amendements', {
            url: '/amendements.html?loi&etape',
            template: '<div amendements read-mode class="amendements"></div>',
            controller: 'mainCtrl'
        })
        .state('debates', {
            url: '/debats.html?loi&etape',
            template: '<div debats class="debats"></div>',
            controller: 'mainCtrl'
        });

    $urlRouterProvider
        .when('/loi.html', '/articles.html')
        .when('/loi', '/articles.html')
        .when('/amendements', '/amendements.html')
        .when('/debats', '/debats.html')
        .otherwise('/');

    $locationProvider.html5Mode(true);
}).run(function ($rootScope, $state, $location, $log, API_ROOT_URL) {
    $rootScope.$state = $state;
    $rootScope.APIRootUrl = API_ROOT_URL;
    $rootScope.mod = null;
    $rootScope.error = '';
    $rootScope.tutorial = false;

    $rootScope.display_error = function (e) {
        $log.error(e);
        $rootScope.error = e;
    };
}).filter('formatDate', function() {
    return function (d) {
        if (!d) return 'EN COURS';
        var d2 = d.split('-');
        return d2[2] + "/" + d2[1] + "/" + d2[0];
    }
}).filter('slug', function() {
    return function (str) {
        str = str.replace(/^\s+|\s+$/g, ''); // trim
        str = str.toLowerCase();

        // remove accents, swap ñ for n, etc
        var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
        var to =   "aaaaeeeeiiiioooouuuunc------";
        for (var i = 0, l = from.length; i < l; i++) {
            str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
        }

        str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
            .replace(/\s+/g, '-') // collapse whitespace and replace by -
            .replace(/-+/g, '-'); // collapse dashes

        return str;
    };
});
