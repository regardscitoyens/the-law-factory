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
    .config(['usSpinnerConfigProvider', function (usSpinnerConfigProvider) {
        usSpinnerConfigProvider.setDefaults({
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
        });
    }])
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
            .state('law', {
                abstract: true,
                templateUrl: 'templates/law.html',
                controller: 'lawCtrl'
            })
            .state('law.articles', {
                url: '/articles.html?loi&article&numeroEtape',
                templateUrl: 'templates/mod1.html',
                controller: 'mod1Ctrl'
            })
            .state('law.amendements', {
                url: '/amendements.html?loi&etape',
                template: '<div mod2 class="mod2"></div>',
                controller: 'mainCtrl'
            })
            .state('law.debates', {
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
    .run(function ($log, $rootScope, $state, API_ROOT_URL) {
        $rootScope.$state = $state;
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