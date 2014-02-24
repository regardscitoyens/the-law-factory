'use strict';

/* Directives */

angular.module('theLawFactory.directives', [])
  .directive('mod1', [ 'apiService', '$rootScope','$location', function (apiService,$rootScope,$location) {
    return {
      restrict: 'A',
      replace: false,
      templateUrl: 'templates/mod1.html',
      link: function postLink(scope, element, attrs) {
		
		
		var l="pjl09-200"
		
			console.log($location.search())
	        //$location.path("/abc");
	        if($location.search()['l']!=null) l=$location.search()['l'];
	 		$("#search-btn").on("click",function() {
	 			$("body").css("overflow","hidden");
	 			$(".lawlist").effect( "slide", {"direction" : "","mode" : "show"}, 500 )
	 		})
		
      	var mod1 = thelawfactory.mod1();

        function update(){
			$(".lawlist").css("display","none")
      		apiService.getDataSample(scope.dataUrl+l).then(
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
  .directive('lawlist', ['apiService', '$rootScope', "$location",function (apiService,$rootScope,$location) {
    return {
      restrict: 'A',
      replace: false,
      template: '<input auto-complete id="search" placeholder="Search a law" ng-model="selected">',
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
			        response(
			        	$.map($.grep(scope.ll, function(value) {
			            return matcher.test(value.title);
			        }),function(n,i) {	        	
			        	return {"label":n.title, "value":n.id}    	
			        })
		        );
             },
            open: function() {
             	
             	var h=$(".ui-autocomplete").position().top;
             	$(".ui-autocomplete").height($(window).height()-h);
             	
             },
             appendTo:".lawlist",
                select: function(event, ui) {
                    $rootScope.$apply(function() {
						$("body").css("overflow","auto");
				        $location.search("l="+ui.item.value);
				        
				      });
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

