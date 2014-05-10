'use strict';

// Useful functions
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
},  clean_accents  = function(term) {
    var ret = "";
    for ( var i = 0; i < term.length; i++ ) {
        ret += accentMap[ term.charAt(i) ] || term.charAt(i);
    }
    return ret;
},  opacity_amdts = function(d){
    if (d > 1000) d = 1000;
    return 0.05+0.75*d/1000;
},  opacity_mots = function(d){
    if (d > 100000) d = 100000;
    return 0.05+0.75*d/100000;
};


$("#search-btn").on("click", function() {
    $("body").css("overflow", "hidden");
    $(".lawlist").effect("slide", {
        direction : "right",
        mode : "show"
    }, 600)
    $("#search").focus();
});

/* Directives */

angular.module('theLawFactory.directives', []).directive('mod1', ['api', '$rootScope', '$location', '$compile',
function(api, $rootScope, $location, $compile) {
	return {
		restrict : 'A',
		replace : false,
		templateUrl : 'templates/mod1.html',
		link : function postLink(scope, element, attrs) {

            $rootScope.s=null;
			var l = "pjl12-719"
            scope.mod="mod1";
            scope.s=null;
			if ($location.search()['l'] != null)
				l = $location.search()['l'];
            else $location.search("l="+l);
			var mod1 = thelawfactory.mod1();

			function update() {

                var target = document.getElementById('preload');
                var spinner = new Spinner(scope.opts).spin(target);

				api.getArticle(l).then(function(data) {
					scope.dataSample = data;
					d3.select(element[0]).datum(data).call(mod1)
                    spinner.stop();
				}, function(error) {
                                    console.log(error);
					scope.error = error
				})
			}
                        // Useless watch ?
			scope.$watch('dataUrl', function() {
				update();
			}, true)

		}
	};
}]).directive('mod2', ['api', '$rootScope', '$location', '$compile',
function(api, $rootScope, $location, $compile) {
	return {
		restrict : 'A',
		replace : false,
		templateUrl : 'templates/mod2.html',
		controller : function($scope, $element, $attrs) {

			$scope.l = "pjl09-602"
			$rootScope.l = $scope.l;
			$scope.step = 0;
			$scope.s = $rootScope.s = $location.search()['s'];
            $scope.a = $location.search()['a'];
            $scope.mod="mod2";
			$scope.hasAmendements = true;
			$scope.hasInterventions = true;

		},
		link : function postLink(scope, element, attrs) {

			if ($location.search()['l'] != null)
				scope.l = $rootScope.l = $location.search()['l'];
			var mod2 = thelawfactory.mod2();

			function update() {

                var target = document.getElementById('preload');
                var spinner = new Spinner(scope.opts).spin(target);
				api.getProcedure(scope.l + "?sect=amd").then(function(data) {

					scope.dataSample = data;

					if ($location.search()['s'] != null) {

						api.getAmendement(scope.l, $location.search()['s'] ).then(function(data) {

							var elementPos = scope.dataSample.map(function(x) {
								return x.step_name;
							}).indexOf(scope.s);
							$(".stage:eq(" + elementPos + ")").addClass("step-curr")

							scope.data = data;
							d3.select(element[0]).datum(data).call(mod2)

                            if($location.search()['a']!=null) {
                                selectRow($location.search()['a'],true);
                            }

                            spinner.stop();

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
}]).directive('mod2b', ['api', '$rootScope', '$location', '$compile',
function(api, $rootScope, $location, $compile) {
	return {
		restrict : 'A',
		replace : false,
		templateUrl : 'templates/mod2b.html',
		controller : function($scope, $element, $attrs) {

			$scope.l = "pjl09-602"
			$scope.step = 0;
            $scope.mod="mod2b";
			$scope.s = $rootScope.s = $location.search()['s'];
			$scope.hasAmendements = true;
			$scope.hasInterventions = true;

		},
		link : function postLink(scope, element, attrs) {

			if ($location.search()['l'] != null)
				scope.l = $location.search()['l'];
			function update() {
                var target = document.getElementById('preload');
                var spinner = new Spinner(scope.opts).spin(target);

				if ($location.search()['s'] != null) {

					api.getIntervention(scope.l).then(function(data) {
						scope.data = data;
						init(data, $location.search()['s'])

                        spinner.stop();

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
.directive('mod0', ['api', '$rootScope', '$location', '$compile',
function(api, $rootScope, $location, $compile) {
	return {
		restrict : 'A',
		replace : false,
		templateUrl : 'templates/mod0.html',
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

                var target = document.getElementById('preload');
                var spinner = new Spinner(scope.opts).spin(target);

				api.getStats().then(function(data) {
					d3.select(element[0]).datum(data).call(mod0_bars)

				}, function(error) {
					console.log(error)
				})

				api.getDossiers(scope.dossierUrl).then(function(data) {

					d3.select(element[0]).datum(data).call(mod0)
                    spinner.stop();

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
.directive('lawlist', ['api', '$rootScope', "$location",
function(api, $rootScope, $location) {
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

    			function update() {

				api.getLawlist().then(function(data) {
					scope.ll = data;
                                        // Process data to a list of law object
                                        // with properties' names set by headers
                                        var headers, laws, rows = scope.ll.split(/\r\n|\n/);
                                        headers = rows.splice(0,1)[0].split(";");
                                        laws = $.map(rows, function(row) {
                                            var law = {}, lawdata = row.split(';');
                                            $.each(headers, function(i, header) {
                                                law[header] = lawdata[i];
                                            });
                                            return law;
                                        });

                                        document.lawlist = laws;

					$("#search").autocomplete({
						source : function(request, response) {

							var matcher = new RegExp($.ui.autocomplete.escapeRegex(clean_accents(request.term)), "i");
							response($.map($.grep(laws, function(value) {
                                                            value = clean_accents(value.Titre +" "+ value.id +" "+ value["Thèmes"] + " " + value.short_title);
							    return matcher.test(clean_accents(value));
							}), function(n, i) {
								return {
									"label" : n.Titre + " (" + n.short_title.replace(/ \([^)]*\)/g, '') + ")",
									"value" : n.id,
                                    "themes": n["Thèmes"],
                                    "amendements": n.total_amendements,
                                    "words": n.total_mots,
                                    "dates": n["Date initiale"] + (n["Date de promulgation"] ? " → " + n["Date de promulgation"] : "")
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
                                $location.path("/mod1");
                                $location.search("l=" + ui.item.value);
                        });
                    }
                })

                    .data( "ui-autocomplete" )._renderItem = function( ul, item ) {

                    var themesdiv=$("<div>")
                    item.themes.replace(/ et /g, ', ').split(', ').forEach(function(e,j){
                        themesdiv.append("<span class='glyphicon glyphicon-tag'></span> "+e+" ");
                    })


                    var icodiv=$("<div class='src-ico'>")
                        .append('<div><span class="glyphicon glyphicon-calendar"></span> '+item.dates+"</div>")
                        .append('<div title="'+item.amendements+' amendements déposés sur ce texte" class="search"><span class="glyphicon glyphicon-folder-open" style="opacity: '+opacity_amdts(item.amendements)+'"></span> '+item.amendements+"</div>")
                        .append('<div title="'+item.words+' mots prononcés lors des débats sur ce texte" class="search"><span class="glyphicon glyphicon-comment" style="opacity: '+opacity_mots(item.words)+'"></span> '+1000*(Math.round(item.words / 1000.))+"</div>")
                        .append(themesdiv);

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
.directive('stepsbar', ['api', '$rootScope', "$location",
    function(api, $rootScope, $location) { return {
        restrict : 'A',
        replace : false,
        templateUrl : 'templates/stepsbar.html',
        controller : function($scope, $element, $attrs) {
            $scope.s = $rootScope.s;
            $scope.l=$location.search()['l'];
        },
        link : function preLink(scope, element, attrs, stepsbarCtrl) {

            function capitalize(s) {
                if (!s) return "";
                return s.charAt(0).toUpperCase() + s.substring(1);
            }

            scope.total=0;
            api.getProcedure(scope.l).then(function(data) {

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
                            if(e.step==="depot") currStage.name="depot"
                            else currStage.name = e.stage;
                            currStage.num = 1;
                        }
                        else if(currStage.name.toLowerCase() === e.stage.toLowerCase() || (currStage.name.indexOf("depot")>=0 && e.step.toLowerCase()==="depot")) {
                            if(currStage.name.indexOf("depot")>=0) currStage.name="depots"
                            currStage.num++;
                        }
                        else {
                            var obj = $.extend(true, {}, currStage);
                            scope.stages.push(obj);
                            if(e.step==="depot") currStage.name="depot"
                            else currStage.name = e.stage;
                            currStage.num=1;
                        }

                        if(e.step==="depot") {
                            if(!currInst) {
                                currInst={};
                                currInst.name = e.auteur_depot;
                                currInst.num = 1;
                            }

                            else if(currInst.name!==e.auteur_depot) {
                                var obj = $.extend(true, {}, currInst);
                                scope.inst.push(obj);
                                currInst.name = e.auteur_depot;
                                currInst.num = 1;
                            }
                            else currInst.num++;
                        }
                        else {

                            if(!currInst) {
                                currInst={};
                                currInst.name= e.institution;
                                currInst.num=1;
                            }

                            else if(e.institution === currInst.name) {
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

            }, function(error) {
                scope.error = error
            })

        }
    }}
]);
