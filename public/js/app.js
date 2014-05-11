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
    .when('/',{redirectTo: '/mod0'})
// templateUrl: 'partials/main', controller: 'mainCtrl'})
    .when('/mod0',{template: '<div mod0="mod0" class="padded mod0"></div>', controller: 'mainCtrl'})
    .when('/mod1',{template: '<div mod1="mod1" class="padded mod1"></div>', controller: 'mainCtrl'})
    .when('/mod2',{template: '<div mod2="mod2" class="padded mod2"></div>', controller: 'mainCtrl'})
    .when('/mod2b',{template: '<div mod2b="mod2b" class="padded mod2b"></div>', controller: 'mainCtrl'})
    .otherwise({redirectTo: '/mod0'});
    $locationProvider.html5Mode(true);
});

//angular.module('theLawFactory', ["angucomplete"]);
