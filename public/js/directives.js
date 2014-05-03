'use strict';

/* Directives */

angular.module('theLawFactory.directives', []).directive('mod1', ['apiService', '$rootScope', '$location', '$compile',
function(apiService, $rootScope, $location, $compile) {
	return {
		restrict : 'A',
		replace : false,
		templateUrl : 'templates/mod1.html',
		link : function postLink(scope, element, attrs) {

            $rootScope.s=null;
			var l = "pjl12-719"
            scope.s=null;
			if ($location.search()['l'] != null)
				l = $location.search()['l'];
                else $location.search("l="+l)
			$("#search-btn").on("click", function() {
				$("body").css("overflow", "hidden");
				$(".lawlist").effect("slide", {
					"direction" : "",
					"mode" : "show"
				}, 500)
                $("#search").focus();
			})
			var mod1 = thelawfactory.mod1();



			function update() {
				$(".lawlist").css("display", "none")

				apiService.getDataSample(scope.dataUrl + l).then(function(data) {
					scope.dataSample = data;
					d3.select(element[0]).datum(data).call(mod1)
				}, function(error) {
					scope.error = error
				})

				apiService.getDataSample(scope.procedureUrl + l).then(function(data) {
					var a = data.steps[data.steps.length - 1].source_url
					//$(".separator").html('<h4 class="law-title">' + capitalize(data.long_title) + '</h4><span class="links"><a href="' + data.url_dossier_senat + '"><span class="glyphicon glyphicon-link"></span> dossier Sénat</a><br/><a href="' + data.url_dossier_assemblee + '"><span class="glyphicon glyphicon-link"></span> dossier AN</a></span>')
					/*scope.b = data.steps.filter(function(d) {
						return d.debats_order != null
					})
					scope.b.sort(function(a, b) {
						return a.debats_order - b.debats_order
					})
					var len = 100 / scope.b.length;

					var newElement = $compile( "<div class='stage-container' style='float:left; width:"+len+"%' ng-repeat='el in b'><div class='stage'>{{el.directory.split('_').slice(2,4).join(' ')}}<br/><a ng-if='el.source_url != \"renvoi en commission\"' href='{{el.source_url}}'><span class='glyphicon glyphicon-link'></span></a><span ng-if='el.source_url == \"renvoi en commission\"' class='renvoi'><br/>{{el.source_url}}</span></div></div>" )(scope);
					element.find(".stages").append(newElement);*/
				})
			}


			scope.$watch('dataUrl', function() {
				update();
			}, true)

		}
	};
}]).directive('mod2', ['apiService', '$rootScope', '$location', '$compile',
function(apiService, $rootScope, $location, $compile) {
	return {
		restrict : 'A',
		replace : false,
		templateUrl : 'templates/mod2.html',
		controller : function($scope, $element, $attrs) {

			$scope.l = "pjl09-602"
			$rootScope.l = $scope.l;
			$scope.step = 0;
			$scope.s = $rootScope.s = $location.search()['s'];
			$scope.hasAmendements = true;
			$scope.hasInterventions = true;

			/*$scope.loadStep = function(sect, ind) {
				$scope.step = ind;
				$scope.s = sect;
				$(".step-curr").removeClass("step-curr")
				$(".stage:eq(" + ind + ")").addClass("step-curr")
				$location.search({
					l : $scope.l,
					s : $scope.s
				})
			}*/
		},
		link : function postLink(scope, element, attrs) {

			if ($location.search()['l'] != null)
				scope.l = $rootScope.l = $location.search()['l'];
			$("#search-btn").on("click", function() {
				$("body").css("overflow", "hidden");
				$(".lawlist").effect("slide", {
					"direction" : "",
					"mode" : "show"
				}, 500)
                $("#search").focus();
			})
			var mod2 = thelawfactory.mod2();

			function update() {
				$(".lawlist").css("display", "none")
				apiService.getDataSample(scope.procedureUrl + scope.l + "?sect=amd").then(function(data) {

					scope.dataSample = data;
                    //$(".separator").html('<h4 class="law-title">' + capitalize(data.long_title) + '</h4><span class="links"><a href="' + data.url_dossier_senat + '"><span class="glyphicon glyphicon-link"></span> dossier Sénat</a><br/><a href="' + data.url_dossier_assemblee + '"><span class="glyphicon glyphicon-link"></span> dossier AN</a></span>')
					/*var len = 95 / scope.dataSample.length;
					var mar = 5 / scope.dataSample.length;
					var newElement = $compile( "<div class='stage-container' style='margin-right:"+mar+"%;float:left; width:"+len+"%' ng-repeat='el in dataSample'><ng-switch style='width:100%; height:100%;' on='el.amds'><div class='stage valid-step' ng-click='loadStep(el.step_name, $index)' ng-switch-when='true'>{{el.step_name.split('_').slice(2,4).join(' ')}}</div><div class='stage' ng-switch-default>{{el.step_name.split('_').slice(2,4).join(' ')}}</div></ng-switch></div>" )(scope);

					element.find(".stages").append(newElement);
                     */
					if ($location.search()['s'] != null) {
						
						apiService.getDataSample(scope.amdUrl + scope.l+'/'+$location.search()['s'] ).then(function(data) {
							console.log(data)
							var elementPos = scope.dataSample.map(function(x) {
								return x.step_name;
							}).indexOf(scope.s);
							$(".stage:eq(" + elementPos + ")").addClass("step-curr")

							scope.data = data;
							d3.select(element[0]).datum(data).call(mod2)

						}, function(error) {
							scope.error = error
						})
					}

				}, function(error) {
					scope.error = error
				})
			}


			scope.$watch('amdUrl', function() {
				update();
			}, true)
		}
	};
}]).directive('mod2b', ['apiService', '$rootScope', '$location', '$compile',
function(apiService, $rootScope, $location, $compile) {
	return {
		restrict : 'A',
		replace : false,
		templateUrl : 'templates/mod2b.html',
		controller : function($scope, $element, $attrs) {

			$scope.l = "pjl09-602"
			$scope.step = 0;
			$scope.s = $rootScope.s = $location.search()['s'];
			$scope.hasAmendements = true;
			$scope.hasInterventions = true;

			/*$scope.loadStep = function(sect, ind) {
				$scope.step = ind;
				$scope.s = sect;
				$(".step-curr").removeClass("step-curr")
				console.log($(".stage:eq(" + ind + ")"))
				$(".stage:eq(" + ind + ")").addClass("step-curr")
				$location.search({
					l : $scope.l,
					s : $scope.s
				})
			}*/
		},
		link : function postLink(scope, element, attrs) {

			if ($location.search()['l'] != null)
				scope.l = $location.search()['l'];
			$("#search-btn").on("click", function() {
				$("body").css("overflow", "hidden");
				$(".lawlist").effect("slide", {
					"direction" : "",
					"mode" : "show"
				}, 500)
                $("#search").focus();
			})
			function update() {
				$(".lawlist").css("display", "none")

				/*apiService.getDataSample(scope.procedureUrl + scope.l + "?sect=int").then(function(data) {

					scope.dataSample = data;
					var len = 95 / scope.dataSample.length;
					var mar = 5 / scope.dataSample.length;
					var newElement = $compile( "<div class='stage-container' style='margin-right:"+mar+"%;float:left; width:"+len+"%' ng-repeat='el in dataSample'><ng-switch style='width:100%; height:100%;' on='el.ints'><div class='stage valid-step' ng-click='loadStep(el.step_name, $index)' ng-switch-when='true'>{{el.step_name.split('_').slice(2,4).join(' ')}}</div><div class='stage' ng-switch-default>{{el.step_name.split('_').slice(2,4).join(' ')}}</div></ng-switch></div>" )(scope);

					element.find(".stages").append(newElement);
				}, function(error) {
					scope.error = error
				})*/
				if ($location.search()['s'] != null) {

					apiService.getDataSample(scope.intUrl + scope.l).then(function(data) {
						console.log(data)
						scope.data = data;
						init(data, $location.search()['s'])

					}, function(error) {
						scope.error = error
					})
				}

			}


			scope.$watch('amdUrl', function() {
				update();
			}, true)
		}
	};
}])
.directive('mod0', ['apiService', '$rootScope', '$location', '$compile',
function(apiService, $rootScope, $location, $compile) {
	return {
		restrict : 'A',
		replace : false,
		templateUrl : 'templates/mod0.html',
		controller : function($scope, $element, $attrs) {


			$scope.loadStep = function(sect, ind) {
				
			}
		},
		link : function postLink(scope, element, attrs) {

            $("#mod0-slider").slider({
                min:1,
                max:10,
                animate: true,
                value:1,
                slide: function( event, ui ) {
                    zooming(ui.value);

                }
            })
			var mod0 = thelawfactory.mod0();
			var mod0_bars = thelawfactory.mod0_bars();
			
			function update() {
				$(".lawlist").css("display", "none")


				apiService.getDataSample(scope.statsUrl).then(function(data) {
					console.log(data)
					d3.select(element[0]).datum(data).call(mod0_bars)
					
				}, function(error) {
					console.log(error)
				})

				apiService.getDataSample(scope.dossierUrl).then(function(data) {
					
					d3.select(element[0]).datum(data).call(mod0)
					
				}, function(error) {
					console.log(error)
				})
			}
			scope.$watch('amdUrl', function() {
				update();
			}, true)
		}
	};
}])
.directive('lawlist', ['apiService', '$rootScope', "$location",
function(apiService, $rootScope, $location) {
	return {
		restrict : 'A',
		replace : false,
		template : '<input auto-complete id="search" placeholder="Chercher une loi" ng-model="selected"><img ng-click="closeSearch()" class ="cls" src="img/cross.png"/> ',
		controller : function($scope, $element, $attrs) {

			$scope.closeSearch = function() {
				$(".lawlist").fadeOut(200);
				$("body").css("overflow", "auto");
			}
		},
		link : function postLink(scope, element, attrs, lawlistCtrl) {

            var accentMap = {

                "á": "a",
                "à": "a",
                "â": "a",
                "é": "e",
                "è": "e",
                "ê": "e",
                "ë": "e",
                "ç": "c",
                "î": "i",
                "ï": "i",
                "ô": "o",
                "ö": "o",
                "ù": "u",
                "Û": "u",
                "ü": "u"

            };
            var normalize = function( term ) {
                var ret = "";
                for ( var i = 0; i < term.length; i++ ) {
                    ret += accentMap[ term.charAt(i) ] || term.charAt(i);
                }
                return ret;
            };

			function update() {

				apiService.getDataSample(scope.lawlistUrl).then(function(data) {
					scope.ll = data;


					$("#search").autocomplete({
						source : function(request, response) {

							var matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), "i");
							response($.map($.grep(scope.ll, function(value) {
                                value = value.title || value.id || value.themes;
								return matcher.test(value) || matcher.test( normalize( value ) );
							}), function(n, i) {
								return {
									"label" : n.title,
									"value" : n.id,
                                    "themes": n.themes,
                                    "amendements": n.amendements,
                                    "words": n.words
								}
							}));
						},
                        focus : function(event, ui) {
                            event.preventDefault();
                            $(".src-fcs").removeClass("src-fcs");
                            $("."+ui.item.value).addClass("src-fcs");
                        },
						open : function() {

							var h = $(".ui-autocomplete").position().top;
							$(".ui-autocomplete").height($(window).height() - h);

						},
						appendTo : ".lawlist",
						select : function(event, ui) {
							$rootScope.$apply(function() {
								$("body").css("overflow", "auto");
								$location.search("l=" + ui.item.value);

							});
						}
					})

                        .data( "ui-autocomplete" )._renderItem = function( ul, item ) {

                        var icodiv=$("<div class='src-ico'>")
                            .append("<div><span class='glyphicon glyphicon-folder-open'></span> "+item.amendements+"</div>")
                            .append("<div><span class='glyphicon glyphicon-comment'></span> "+item.words+"</div>")
                            .append("<div><span class='glyphicon glyphicon-tags'></span> "+item.themes+"</div>");

                        var txtdiv=$("<div class='src-txt'>")
                            .append( "<a>" +item.label + "</a>" )
                            .append(icodiv)

                        return $( "<li class="+item.value+">" )
                            .append(txtdiv)
                            .appendTo( ul );
                    };

				}, function(error) {
					scope.error = error
				})
			}


			scope.$watch('lawlistUrl', function() {
				update();
			}, true)

		}
	};
}])

.directive('movescroll', [ '$rootScope',function($rootScope) {
	return {
		restrict : 'A',
		controller : function($scope, $element, $attrs) {
			$scope.pos=[-1,-1];
			$scope.xmouselerp=d3.scale.linear().range([-100,0,0,100]).clamp(true);
			$scope.ymouselerp=d3.scale.linear().range([-100,0,0,100]).clamp(true);
		},
		link : function postLink(scope, element, attrs,movescrollCtrl) {
		
		
			scope.xmouselerp.domain([0,element.width()*0.2,element.width()*0.8, element.width()])
			scope.ymouselerp.domain([0,element.height()*0.2,element.height()*0.8, element.height()])


            var clicking = false;
            var inpos=[-1,-1];

            element.mousedown(function(e){
                clicking = true;
                inpos[0]= e.pageX;
                inpos[1]= e.pageY;
            });

            $(document).mouseup(function(){
                clicking = false;
                inpos=[-1,-1];
            });

            element.mousemove(function(e){
                if(clicking == false) return;
                e.stopPropagation();
                var x = (e.pageX-inpos[0])*2;
                var y = (e.pageY-inpos[1])*2;
                element.scrollTop(element.scrollTop()-y);
                element.scrollLeft(element.scrollLeft()-x);
                inpos[0]=e.pageX;
                inpos[1]=e.pageY;



            });

		
		}
	};
}])
    .directive('stepsbar', ['apiService', '$rootScope', "$location",
        function(apiService, $rootScope, $location) {
            return {
                restrict : 'A',
                replace : false,
                templateUrl : 'templates/stepsbar.html',
                controller : function($scope, $element, $attrs) {
                    $scope.s = $rootScope.s;

                    $scope.l=$location.search()['l'];
                },
                link : function preLink(scope, element, attrs, stepsbarCtrl) {

                    function capitalize(s) {
                        return s.charAt(0).toUpperCase() + s.substring(1);
                    }

                    //console.log("lol",scope.s);
                    scope.total=0;
                    apiService.getDataSample(scope.procedureUrl+scope.l).then(function(data) {

                        $(".separator").html('<h4 class="law-title">' + capitalize(data.long_title) + '</h4><span class="links"><a href="' + data.url_dossier_senat + '"><span class="glyphicon glyphicon-link"></span> dossier Sénat</a><br/><a href="' + data.url_dossier_assemblee + '"><span class="glyphicon glyphicon-link"></span> dossier AN</a></span>')

                        scope.stages=[],
                        scope.steps=[],
                        scope.inst=[];
                        var currStage,
                            currInst;

                        data.steps.forEach(function(e,j){

                            if(e.debats_order!==null) {

                                scope.total++;
                                scope.steps.push(e);

                                if(!currStage) {
                                    currStage={};
                                    currStage.name= e.stage;
                                    currStage.num= 1;
                                }
                                else if(currStage.name === e.stage) {
                                    currStage.num++;
                                }
                                else {
                                    var obj = $.extend(true, {}, currStage);
                                    scope.stages.push(obj);
                                    currStage.name= e.stage;
                                    currStage.num=1;
                                }

                                if(e.step==="depot") {
                                    if(!currInst) currInst={}
                                    currInst.name="depot"
                                    currInst.num=1;
                                }
                                else {
                                    if(e.institution === currInst.name) {
                                        currInst.num++;
                                    }
                                    else {
                                        var obj = $.extend(true, {}, currInst);
                                        scope.inst.push(obj);
                                        currInst.name= e.institution;
                                        currInst.num=1;
                                    }
                                }

                            }
                        });

                        scope.stages.push(currStage);
                        scope.inst.push(currInst);
                        console.log(scope.stages,scope.inst)

                    }, function(error) {
                        scope.error = error
                    })

                }
            };
        }]);
