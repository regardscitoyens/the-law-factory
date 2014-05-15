'use strict';

// Declare app level module which depends on filters, and services

angular.module('theLawFactory', [
  'theLawFactory.controllers',
  'theLawFactory.services',
  'theLawFactory.directives',
]).
config(function ($routeProvider, $locationProvider) {
  $routeProvider
    .when('/',              {template: '<div mod0="mod0" class="padded mod0"></div>', title:'La fabrique de la loi - Law list', controller: 'mainCtrl'})
    .when('/loi',           {template: '<div mod1="mod1" class="padded mod1"></div>',  title:'La fabrique de la loi - Law articles',controller: 'mainCtrl'})
    .when('/amendements',   {template: '<div mod2="mod2" class="padded mod2"></div>', title:'La fabrique de la loi - Law amendements', controller: 'mainCtrl'})
    .when('/debats',        {template: '<div mod2b="mod2b" class="padded mod2"></div>', title:'La fabrique de la loi - Law debats', controller: 'mainCtrl'})
    .when('/mod1',  {redirectTo: '/loi'})
    .when('/mod2',  {redirectTo: '/amendements'})
    .when('/mod2b', {redirectTo: '/debats'})
    .otherwise(     {redirectTo: '/'});
    $locationProvider.html5Mode(true);
});

//angular.module('theLawFactory', ["angucomplete"]);
