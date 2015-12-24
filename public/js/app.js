'use strict';

// Default configuration - do not change here
// Configuration id to be set in public/js/config.js
angular.module('theLawFactory.config', [])
    .constant('API_ROOT_URL', 'http://www.lafabriquedelaloi.fr/api/')
    .constant('GOOGLE_ANALYTICS_ID', '')
    .constant('HOST_FOR_GOOGLE', '');


// Declare app level module which depends on filters, and services
angular.module('theLawFactory', [
    'ngSanitize',
    'ui.router',
    'theLawFactory.config',
    'theLawFactory.controllers',
    'theLawFactory.services',
    'theLawFactory.directives',
    'theLawFactory.analytics'
])
    .config(function ($stateProvider, $urlRouterProvider) {
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
                template: '<div mod0 class="mod0"></div>',
                controller: 'mainCtrl'
            })
            .state('articles', {
                url: '/articles.html?loi&article&numeroEtape',
                templateUrl: 'templates/mod1.html',
                controller: 'mod1Ctrl'
            })
            .state('amendements', {
                url: '/amendements.html?loi&etape',
                template: '<div mod2 class="mod2"></div>',
                controller: 'mainCtrl'
            })
            .state('debates', {
                url: '/debats.html?loi&etape',
                template: '<div mod2b class="mod2"></div>',
                controller: 'mainCtrl'
            });

        $urlRouterProvider
            .when('/loi.html', '/articles.html')
            .when('/loi', '/articles.html')
            .when('/amendements', '/amendements.html')
            .when('/debats', '/debats.html')
            .otherwise('/');
    })
    .run(function ($log, $rootScope, API_ROOT_URL) {
        $rootScope.APIRootUrl = API_ROOT_URL;
        $rootScope.error = '';
        $rootScope.display_error = function (e) {
            $log.error(e);
            $rootScope.error = e;
        };
    })
    .filter('lawTitle', function() {
        return function(long_title, short_title, loi) {
            if (long_title.length > 60) {
                return loi.substr(0,3).toUpperCase() + " " + thelawfactory.utils.upperFirst(short_title);
            } else {
                return thelawfactory.utils.upperFirst(long_title);
            }
        }
    });