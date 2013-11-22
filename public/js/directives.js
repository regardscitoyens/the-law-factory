'use strict';

/* Directives */

angular.module('theLawFactory.directives', [])
  .directive('mod1', [ 'apiService', '$rootScope', function (apiService) {
    return {
      restrict: 'A',
      replace: false,
      templateUrl: '../templates/mod1.html',
      link: function postLink(scope, element, attrs) {

      	var mod1 = thelawfactory.mod1();

        function update(){

      		apiService.getDataSample(scope.dataUrl).then(
            function(data){
              scope.dataSample = data;
              d3.select(element[0])
            		.datum(data)
            		.call(mod1)
            },
            function(error){
              scope.error = error
            }
            )

        }

      	scope.$watch('dataUrl', function(){
          update();
      	},true)

      }
    };
  }])
