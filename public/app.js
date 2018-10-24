'use strict';


// Default config, overridable in config.js
angular.module('theLawFactory.config', [])
.constant('API_ROOT_URL', 'https://www.lafabriquedelaloi.fr/api/')
.constant('HOST_FOR_GOOGLE', '')
.constant('GOOGLE_ANALYTICS_ID', '')
.constant('PIWIK_HOST', '')
.constant('PIWIK_SITE_ID', null);

// Declare app level module
angular.module('theLawFactory', [
    'ngSanitize',
    'ui.router',
    'theLawFactory.config'
])
.config(function ($locationProvider, $stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('home', {
            url: '/',
            template: '<div home id="home"></div>',
            controller: 'mainCtrl'
        })
        .state('about', {
            url: '/a-propos.html',
            templateUrl: 'modules/about/about.html',
            controller: 'mainCtrl'
        })
        .state('metrics', {
            url: '/metrics.html',
            template: '<div metrics></div>',
            controller: 'mainCtrl'
        })
        .state('laws', {
            url: '/lois.html?loi',
            template: '<div navettes class="module navettes"></div>',
            controller: 'mainCtrl'
        })
        .state('articles', {
            url: '/articles.html?loi',
            template: '<div articles read-mode class="module articles"></div>',
            controller: 'mainCtrl'
        })
        .state('amendements', {
            url: '/amendements.html?loi&etape',
            template: '<div amendements read-mode class="module amendements"></div>',
            controller: 'mainCtrl'
        })
        .state('debates', {
            url: '/debats.html?loi&etape',
            template: '<div debats class="module debats"></div>',
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
    $rootScope.colorMode = localStorage.getItem('colorMode') || 'normal';

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
}).filter('s_plural', function() {
    return function (n) {
        if (n > 1) return 's';
        return '';
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
