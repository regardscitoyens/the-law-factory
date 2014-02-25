'use strict';

/* Controllers */

angular.module('theLawFactory.controllers', []).
  controller('mainCtrl', function ($scope, $http, apiService, $rootScope) {

    $scope.error = {}
    $scope.lawlistUrl = 'laws/list'
    $scope.procedureUrl = 'law-procedure/'
    $scope.dataUrl = 'law-article/'
    $scope.amdUrl = 'law-amendments/'
    $scope.dataSample = {}
    
  })
