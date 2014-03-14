'use strict';

/* Directives */

angular.module('theLawFactory.directives', [])
  .directive('mod1', [ 'apiService', '$rootScope','$location','$compile', function (apiService,$rootScope,$location,$compile) {
    return {
      restrict: 'A',
      replace: false,
      templateUrl: 'templates/mod1.html',
      link: function postLink(scope, element, attrs) {
		
		
		var l="pjl12-719"
		
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
            
            apiService.getDataSample(scope.procedureUrl+l).then(
            function(data){
            	var a=data.steps[data.steps.length-1].source_url
            	$(".separator").html('<h4 class="law-title">'+data.long_title+' <sub><a href="'+data.url_dossier_assemblee+'">Assemblée</a>, <a href="'+data.url_dossier_senat+'">Senat</a></sub></h4>')
            	scope.b=data.steps.filter(function(d){return d.debats_order!=null})
                scope.b.sort(function(a,b){return a.debats_order - b.debats_order})
            	var len = 100/scope.b.length;
              	
            	
            var newElement = $compile( "<div class='stage-container' style='float:left; width:"+len+"%' ng-repeat='el in b'><div class='stage'>{{el.directory.split('_').slice(2,4).join(' ')}}  <a href='{{el.source_url}}'><span class='glyphicon glyphicon-link'></span></a></div></div>" )( scope );
			  element.find(".stages").append( newElement );
            })
            
        }

      	scope.$watch('dataUrl', function(){
          update();
      	},true)

      }
    };
  }])
  .directive('mod2', [ 'apiService', '$rootScope', '$location','$compile', function (apiService,$rootScope,$location,$compile) {
    return {
      restrict: 'A',
      replace: false,
      templateUrl: 'templates/mod2.html',
      controller: function ($scope, $element, $attrs) {
      	
      	$scope.l="pjl09-602"
      	$scope.step = 0;
      	$scope.step_name = $location.search()['s'];
      	$scope.hasAmendements = true;
      	$scope.hasInterventions = true;
      	
      	$scope.loadStep = function(sect, ind) {
      		$scope.step = ind;
      		$scope.step_name = sect;
      		$(".step-curr").removeClass("step-curr")
      		$(".stage:eq("+ind+")").addClass("step-curr")
      		$location.search({l:$scope.l, s:$scope.step_name})
      	}
      	
      },
      link: function postLink(scope, element, attrs) {

	        if($location.search()['l']!=null) scope.l=$location.search()['l'];
	 		$("#search-btn").on("click",function() {
	 			$("body").css("overflow","hidden");
	 			$(".lawlist").effect( "slide", {"direction" : "","mode" : "show"}, 500 )
	 		})
		
      	var mod2 = thelawfactory.mod2();

        function update(){
			$(".lawlist").css("display","none")
      		apiService.getDataSample(scope.procedureUrl+scope.l+"?sect=amd").then(
            function(data){
            
              scope.dataSample = data;
              var len = 95/scope.dataSample.length;
              var mar = 5/scope.dataSample.length;
              var newElement = $compile( "<div class='stage-container' style='margin-right:"+mar+"%;float:left; width:"+len+"%' ng-repeat='el in dataSample'><ng-switch style='width:100%; height:100%;' on='el.amds'><div class='stage valid-step' ng-click='loadStep(el.step_name, $index)' ng-switch-when='true'>{{el.step_name.split('_').slice(2,4).join(' ')}}</div><div class='stage' ng-switch-default>{{el.step_name.split('_').slice(2,4).join(' ')}}</div></ng-switch></div>" )( scope );
              
			  element.find(".stages").append( newElement );
			  },
            function(error){
              scope.error = error
            })
			  
			  if($location.search()['s']!=null) {
			  	
			apiService.getDataSample(scope.amdUrl+scope.l+"/"+scope.step_name).then(
            function(data){
            
             var elementPos = scope.dataSample.map(function(x) {return x.step_name; }).indexOf(scope.step_name);
             $(".stage:eq("+elementPos+")").addClass("step-curr")
              scope.data = data;
                d3.select(element[0])
            		.datum(data)
            		.call(mod2)
            
			  },
            function(error){
              scope.error = error
            })
            
           }
            
        }
      	scope.$watch('amdUrl', function(){
          update();
      	},true)
      }
    };
  }])
   .directive('mod2b', [ 'apiService', '$rootScope', '$location','$compile', function (apiService,$rootScope,$location,$compile) {
    return {
      restrict: 'A',
      replace: false,
      templateUrl: 'templates/mod2b.html',
      controller: function ($scope, $element, $attrs) {
      	
      	$scope.l="pjl09-602"
      	$scope.step = 0;
      	$scope.step_name = $location.search()['s'];
      	$scope.hasAmendements = true;
      	$scope.hasInterventions = true;
      	
      	
      	$scope.loadStep = function(sect, ind) {
      		$scope.step = ind;
      		$scope.step_name = sect;
      		$(".step-curr").removeClass("step-curr")
      		console.log($(".stage:eq("+ind+")"))
      		$(".stage:eq("+ind+")").addClass("step-curr")
      		$location.search({l:$scope.l, s:$scope.step_name})
      	}
      	
      },
      link: function postLink(scope, element, attrs) {

	        if($location.search()['l']!=null) scope.l=$location.search()['l'];
	 		$("#search-btn").on("click",function() {
	 			$("body").css("overflow","hidden");
	 			$(".lawlist").effect( "slide", {"direction" : "","mode" : "show"}, 500 )
	 		})
		
      	var mod2b = thelawfactory.mod2b();

        function update(){
			$(".lawlist").css("display","none")
			
			
      		apiService.getDataSample(scope.procedureUrl+scope.l+"?sect=amd").then(
            function(data){
            
              scope.dataSample = data;
              var len = 99/scope.dataSample.length;
              var mar = 1/scope.dataSample.length;
              var newElement = $compile( "<div class='stage-container' style='margin-right:"+mar+"%;float:left; width:"+len+"%' ng-repeat='el in dataSample'><ng-switch style='width:100%; height:100%;' on='el.amds'><div class='stage valid-step' ng-click='loadStep(el.step_name, $index)' ng-switch-when='true'>{{el.step_name.split('_').slice(2,4).join(' ')}}</div><div class='stage' ng-switch-default>{{el.step_name.split('_').slice(2,4).join(' ')}}</div></ng-switch></div>" )( scope );
              
			  element.find(".stages").append( newElement );
			  },
            function(error){
              scope.error = error
            })
			  
			  if($location.search()['s']!=null) {
			apiService.getDataSample(scope.amdUrl+scope.l+"/"+scope.step_name).then(
            function(data){
            
              scope.data = data;
                d3.select(element[0])
            		.datum(data)
            		.call(mod2b)
            
			  },
            function(error){
              scope.error = error
            })
            
           }
            
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
      template: '<input auto-complete id="search" placeholder="Search a law" ng-model="selected"><img ng-click="closeSearch()" class ="cls" src="img/cross.png"/> ',
      controller: function ($scope, $element, $attrs) {
      	 
      	 	$scope.closeSearch= function() {
      		$(".lawlist").fadeOut(200);
      		$("body").css("overflow","auto");
      	}
      	
      },
      link: function postLink(scope, element, attrs,lawlistCtrl) {

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


