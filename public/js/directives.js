'use strict';

/* Directives */

angular.module('theLawFactory.directives', [])
  .directive('mod1', [ 'apiService', '$rootScope', function (apiService) {
    return {
      restrict: 'A',
      replace: false,
      templateUrl: 'templates/mod1.html',
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
  .directive('mod2', [ 'apiService', '$rootScope', function (apiService) {
    return {
      restrict: 'A',
      replace: false,
      templateUrl: 'templates/mod2.html',
      link: function postLink(scope, element, attrs) {

      	var mod2 = thelawfactory.mod2();

        function update(){

      		apiService.getDataSample(scope.amdUrl).then(
            function(data){
              scope.dataSample = data;
              d3.select(element[0])
            		.datum(data)
            		.call(mod2)
            },
            function(error){
              scope.error = error
            }
            )

        }

      	scope.$watch('amdUrl', function(){
          update();
      	},true)

      }
    };
  }])
  .directive('lawlist', ['apiService', '$rootScope', function (apiService) {
    return {
      restrict: 'A',
      replace: false,
      template: '<input auto-complete id="search" ng-model="selected">',
      //templateUrl: 'templates/mod2.html',
      controller: function ($scope, $element, $attrs) {

        },
      link: function postLink(scope, element, attrs,lawlistCtrl) {

      	//var mod2 = thelawfactory.mod2();

        function update(){

      		apiService.getDataSample(scope.lawlistUrl).then(
            function(data){
              scope.ll = data;
              //console.log(scope.ll)
            
              
              
              $("#search").autocomplete({
                source: function(request,response) {
	              	var matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), "i");
			        response($.grep(scope.ll, function(value) {
			            return matcher.test(value.title);
		        }));
             },
                select: function() {
                    $timeout(function() {
                      iElement.trigger('input');
                    }, 0);
                }
            });
              
              
              
              
            },
            function(error){
              scope.error = error
            })

        }
      	scope.$watch('lawlistUrl', function(){
          update();
      	},true)

      }
    };
  }])

