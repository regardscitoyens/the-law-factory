'use strict';

// Declare app level module which depends on filters, and services

angular.module('theLawFactory', [
  'theLawFactory.controllers',
  'theLawFactory.services',
  'theLawFactory.directives'
]).
config(function ($routeProvider, $locationProvider) {
  $routeProvider

    .when('/',           {templateUrl: 'templates/home.html', controller: 'mainCtrl'})
    .when('/lois.html',       {template: '<div  mod0="mod0"  class="padded mod0"></div>', controller: 'mainCtrl'})
    .when('/loi.html',           {template: '<div  mod1="mod1"  class="padded mod1"></div>', controller: 'mainCtrl'})
    .when('/amendements.html',   {template: '<div  mod2="mod2"  class="padded mod2"></div>', controller: 'mainCtrl'})
    .when('/debats.html',        {template: '<div mod2b="mod2b" class="padded mod2"></div>', controller: 'mainCtrl'})
    .when('/mod0',  {redirectTo: '/lois.html'})
    .when('/mod1',  {redirectTo: '/loi.html'})
    .when('/mod2',  {redirectTo: '/amendements.html'})
    .when('/mod2b', {redirectTo: '/debats.html'})
    .when('/loi',   {redirectTo: '/loi.html'})
    .when('/amendements',  {redirectTo: '/amendements.html'})
    .when('/debats', {redirectTo: '/debats.html'})
    .otherwise(     {redirectTo: '/'});
    $locationProvider.html5Mode(true);
});

//angular.module('theLawFactory', ["angucomplete"]);
