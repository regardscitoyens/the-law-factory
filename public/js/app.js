'use strict';

// Default configuration - do not change here
// Configuration id to be set in public/js/config.js
angular.module('theLawFactory.config', []).constant('API_ROOT_URL', 'http://www.lafabriquedelaloi.fr/api/').constant('GOOGLE_ANALYTICS_ID','');

// Declare app level module which depends on filters, and services
angular.module('theLawFactory', [
  'theLawFactory.config',
  'theLawFactory.controllers',
  'theLawFactory.services',
  'theLawFactory.directives',
  'theLawFactory.analytics'
]).
config(function ($routeProvider, $locationProvider) {
  $routeProvider

    .when('/',           {templateUrl: 'templates/home.html', controller: 'mainCtrl'})
    .when('/lois.html',       {template: '<div  mod0="mod0"  class="padded mod0"></div>', controller: 'mainCtrl'})
    .when('/articles.html',           {template: '<div  mod1="mod1"  class="padded mod1"></div>', controller: 'mainCtrl'})
    .when('/amendements.html',   {template: '<div  mod2="mod2"  class="padded mod2"></div>', controller: 'mainCtrl'})
    .when('/debats.html',        {template: '<div mod2b="mod2b" class="padded mod2"></div>', controller: 'mainCtrl'})
    .when('/mod0',  {redirectTo: '/lois.html'})
    .when('/mod1',  {redirectTo: '/articles.html'})
    .when('/mod2',  {redirectTo: '/amendements.html'})
    .when('/mod2b', {redirectTo: '/debats.html'})
    .when('/loi.html',   {redirectTo: '/articles.html'})
    .when('/loi',   {redirectTo: '/articles.html'})
    .when('/amendements',  {redirectTo: '/amendements.html'})
    .when('/debats', {redirectTo: '/debats.html'})
    .otherwise(     {redirectTo: '/'});
    $locationProvider.html5Mode(true);
});

//angular.module('theLawFactory', ["angucomplete"]);
