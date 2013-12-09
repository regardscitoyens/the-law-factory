'use strict';

// Declare app level module which depends on filters, and services

angular.module('theLawFactory', [
  'theLawFactory.controllers',
  'theLawFactory.filters',
  'theLawFactory.services',
  'theLawFactory.directives'
]).
config(function ($routeProvider, $locationProvider) {
  $routeProvider
    .when('/',{redirectTo: '/', templateUrl: 'partials/main', controller: 'mainCtrl'})
    .when('/mod1',{templateUrl: 'partials/mod1', controller: 'mainCtrl'})
    .when('/mod2',{templateUrl: 'partials/mod2', controller: 'mainCtrl'})
    //.when('/mod0',{templateUrl: 'partials/mod2', controller: 'mainCtrl'})
    .otherwise({redirectTo: '/'});
    $locationProvider.html5Mode(true);
});
