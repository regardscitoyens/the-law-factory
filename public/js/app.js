'use strict';

// Declare app level module which depends on filters, and services

angular.module('theLawFactory', [
  'theLawFactory.controllers',
  'theLawFactory.filters',
  'theLawFactory.services',
  'theLawFactory.directives',
]).
config(function ($routeProvider, $locationProvider) {
  $routeProvider
    .when('/',{redirectTo: '/'})
// templateUrl: 'partials/main', controller: 'mainCtrl'})
    .when('/mod0',{templateUrl: 'templates/mod0.html', controller: 'mainCtrl'})
    .when('/mod1',{templateUrl: 'templates/mod1.html', controller: 'mainCtrl'})
    .when('/mod2',{templateUrl: 'templates/mod2.html', controller: 'mainCtrl'})
    .when('/mod2b',{templateUrl: 'templates/mod2b.html', controller: 'mainCtrl'})
    .otherwise({redirectTo: '/'});
    $locationProvider.html5Mode(true);
});

//angular.module('theLawFactory', ["angucomplete"]);
