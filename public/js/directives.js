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
},  upperFirst = function(s){
    return (!s ? "" : s.charAt(0).toUpperCase() + s.substring(1));
};

$("#search-btn").on("click", function() {
    $("#search").val($("#search").text())
    $("body").css("overflow", "hidden");
    $(".lawlist").effect("slide", {
        direction : "right",
        mode : "show"
    }, 600)
    $(".close-search").show();
    $("#search").focus();
});

/* Directives */

angular.module('theLawFactory.directives', []).directive('mod1', ['api', '$rootScope', '$location', '$compile',
function(api, $rootScope, $location, $compile) {
    return {
        restrict : 'A',
        replace : false,
        templateUrl : 'templates/mod1.html',
        controller: function($scope,$element,$attrs) {
            $scope.mod="mod1";
            $rootScope.tuto_btn = true;
        },
        link : function postLink(scope, element, attrs) {


            var mod1 = thelawfactory.mod1();

            function update() {

                scope.startSpinner();

                api.getArticle(scope.loi).then(function(data) {
                    $rootScope.lawTitle = data.short_title
                    $rootScope.pageTitle =  $rootScope.lawTitle + " - Articles | ";
                    var myheight=$( window ).height() - $("nav").height()-$(".burntsiena").height()-$("#filter-nav").height()-$("footer").height()-parseInt($("#ToolsPanel").css("margin-bottom"))-100;
                    $(".viz-container").height(myheight);
                    $("#viz").height(myheight-100);
                    d3.select(element[0]).datum(data).call(mod1);

                    var pad = parseInt($(".text-container").css("padding-top")) + parseInt($(".text-container").css("padding-bottom"))
                    $(".text-container").height(118+$("#viz").outerHeight()-$(".text h4").outerHeight()-pad)

                    scope.stopSpinner();
                    scope.showFirstTimeTutorial();
                }, function(error) {
                    console.log(error);
                    scope.error = error
                })
            }
            update();

        }
    };
}]).directive('mod2', ['api', '$rootScope', '$location', '$compile',
function(api, $rootScope, $location, $compile) {
    return {
        restrict : 'A',
        replace : false,
        templateUrl : 'templates/mod2.html',
        controller : function($scope, $element, $attrs) {
            $scope.step = 0;
            $scope.mod="mod2";
            $rootScope.tuto_btn = true;
        },
        link : function postLink(scope, element, attrs) {

            $(".scrolling").height("80%");

            var mod2 = thelawfactory.mod2();

            function update() {

                scope.startSpinner();

                if (scope.etape != null) api.getAmendement(scope.loi, scope.etape).then(function(data) {
                    scope.data = data;
                    $rootScope.pageTitle =  $rootScope.lawTitle + " - Amendements | ";

                    var myheight=$( window ).height() - $("nav").height()-$(".burntsiena").height()-$("#filter-nav").height()-$("footer").height()-parseInt($("#ToolsPanel").css("margin-bottom"))-150;
                    $(".scrolling").height(myheight);
                    $(".main-sc").height(myheight-120);

                    d3.select(element[0]).datum(data).call(mod2);
                    $(".text-container").height(118+$(".main-sc").height()+103-$(".text h4").outerHeight())
                }, function(error) {
                    scope.error = error
                });
            }
            update();
            scope.showFirstTimeTutorial();
        }
    }
}])
.directive('mod2b', ['api', '$rootScope', '$location', '$compile',
function(api, $rootScope, $location, $compile) {
    return {
        restrict : 'A',
        replace : false,
        templateUrl : 'templates/mod2b.html',
        controller : function($scope, $element, $attrs) {
            $scope.step = 0;
            $scope.mod="mod2b";
            $rootScope.tuto_btn = true;
        },
        link : function postLink(scope, element, attrs) {

            function update() {

                scope.startSpinner();

                if (scope.etape != null) {

                    api.getIntervention(scope.loi).then(function(data) {
                        scope.data = data;
                        $rootScope.pageTitle =  $rootScope.lawTitle + " - Débats | ";
                        var myheight=$( window ).height() - $("nav").height()-$(".burntsiena").height()-$("#filter-nav").height()-$("footer").height()-parseInt($("#ToolsPanel").css("margin-bottom"))-150;
                        $(".scrolling").height(myheight);
                        $(".main-sc").height(myheight-120);
                        init(data, scope.etape);
                        $(".text-container").height(118+$(".main-sc").height()+73-$(".text h4").outerHeight())
                        /*if($("svg").height()<$("#viz").height()) {
                           var offs=($("#viz").height() - $("svg").height())/2;
                           $("svg").css({"margin-top":offs,"padding-top":"5px"});
                        }*/

                    }, function(error) {
                        scope.error = error
                    })
                }
            }
            update();
            scope.showFirstTimeTutorial();
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

            $rootScope.pageTitle = "";
            scope.mod="mod0";
            $rootScope.tuto_btn = true;

            $("#mod0-slider").slider({
                min:1,
                max:10,
                animate: true,
                value:1,
                slide: function( event, ui ) {
                    zooming(ui.value);
                }
            })
            var mod0 = thelawfactory.mod0(),
                synced = false;


            scope.$on('MAIN_CTRL_START_TUTORIAL', function(event, mass) {
              if(!synced)
                return;

              scope.toggleTutorial(true);
            });

            function update() {
                scope.startSpinner();

                var myheight=$( window ).height() - $("nav").height()-$(".burntsiena").height()-$("#filter-nav").height()-$("footer").height()-parseInt($("#ToolsPanel").css("margin-bottom"))-100;
                $(".scrolling").height(myheight);
                api.getDossiers().then(function(data) {
                  d3.select(element[0]).datum(data).call(mod0);
                    $(".text-container").height($("#legend").outerHeight()+$("#gantt").outerHeight()+$("#bars").outerHeight()+$(".labels-sc h5").outerHeight()-$(".text h4").outerHeight());
                    synced = true;
                    scope.showFirstTimeTutorial();
                }, function(error) {
                    console.log(error)
                })
            }
            update();

        }
    };
}])
.directive('lawlist', ['api', '$rootScope', "$location",
function(api, $rootScope, $location) {
    return {
        restrict : 'A',
        replace : false,
        link : function postLink(scope, element, attrs, lawlistCtrl) {
           function update() {
                api.getLawlist().then(function(data) {
                    scope.ll = data;
                    // Process data to a list of law object
                    // with properties' names set by headers
                    var headers, laws, rows = scope.ll.split(/\r\n|\n/);
                    headers = rows.splice(0,1)[0].split(";").map(function(x){return x.replace(/(^"|"$)/g, '')});
                    laws = $.map(rows, function(row) {
                        var law = {}, lawdata = row.split(';').map(function(x){return x.replace(/(^"|"$)/g, '')});
                        $.each(headers, function(i, header) {
                            law[header] = lawdata[i];
                        });
                        return law;
                    });

                    document.lawlist = laws;

                    $("#search").autocomplete({
                        source : function(request, response) {
                            var matcher = new RegExp($.ui.autocomplete.escapeRegex(clean_accents(request.term)), "i");
                            response($.map($.grep(laws.sort(function(a,b){ return b["Date de promulgation"] > a["Date de promulgation"];}), function(value) {
                                                            value = clean_accents(value.Titre +" "+ value.id +" "+ value["Thèmes"] + " " + value.short_title);
                                return matcher.test(clean_accents(value));
                            }), function(n, i) {
                                return {
                                    "label" : n.short_title.replace(/ \([^)]*\)/g, '') + " (" + n.Titre + ")",
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
                            setTimeout(function() { scope.closeSearch(); },0);
                            $rootScope.$apply(function() {
                                $("body").css("overflow", "auto");
                                $location.path((scope.mod==='mod0' ? '/loi' : '/article') + "s.html");
                                $location.search("loi=" + ui.item.value);
                            });
                        },
                        messages: {
                            noResults: 'Aucune loi trouvée',
                            results: function(d) { return d + " loi" + (d > 1 ? "s trouvées" : " trouvée"); }
                        }
                    })
                    .data( "ui-autocomplete" )._renderItem = function( ul, item ) {
                    var themesdiv=$("<div>")
                    item.themes.replace(/ et /g, ', ').split(', ').forEach(function(e,j){
                        themesdiv.append("<span class='glyphicon glyphicon-tag'></span> "+e.toLowerCase()+" ");
                    })

                    var icodiv=$("<div class='src-ico'>")
                        .append('<div><span class="glyphicon glyphicon-calendar"></span> '+item.dates+"</div>")
                        .append('<div title="'+item.amendements+' amendements déposés sur ce texte" class="search" data-toggle="tooltip" data-placement="bottom"><span class="glyphicon glyphicon-folder-open" style="opacity: '+opacity_amdts(item.amendements)+'"></span> '+item.amendements+"</div>")
                        .append('<div title="'+item.words+' mots prononcés lors des débats sur ce texte" class="search" data-toggle="tooltip" data-placement="bottom"><span class="glyphicon glyphicon-comment" style="opacity: '+opacity_mots(item.words)+'"></span> '+1000*(Math.round(item.words / 1000.))+"</div>")
                        .append(themesdiv);
                        $(".search").tooltip();

                    var txtdiv=$("<div class='src-txt'>")
                        .append( "<a>" +item.label + "</a>" )
                        .append(icodiv);

                    return $( "<li class="+item.value+">" )
                        .append(txtdiv)
                        .appendTo( ul );
                    };
                }, function(error) {
                    scope.error = error
                })
            }
            update();
        }
    }
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
        // No dragging in the borders because of issues with the overflow scollbar
        var gantt_o = $('#gantt').offset(),
            mouse_xmax = gantt_o.left + $('#gantt').width() - 20,
            mouse_ymax = gantt_o.top + $('#gantt').height() - 20;

        element.mousedown(function(e){
            if (e.pageX > mouse_xmax || e.pageY > mouse_ymax)
                return;
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
.directive('stepsbar', ['$timeout','api', '$rootScope', "$location",
    function(timer,api, $rootScope, $location) { return {
        restrict : 'A',
        replace : false,
        templateUrl : 'templates/stepsbar.html',
        controller : function($scope, $element, $attrs) {
        },

        link : function preLink(scope, element, attrs, stepsbarCtrl) {

            scope.total=0;
            api.getProcedure(scope.loi).then(function(data) {

                var tit = upperFirst(data.long_title),
                    leg = "";
                if (tit.length > 150) {
                    leg = ' data-toggle="tooltip" data-placement="bottom" title="'+tit+'"';
                    tit = scope.loi.substr(0,3).toUpperCase() + " " + upperFirst(data.short_title);
                }
                $(".title").html(
                  '<h4 class="law-title"'+leg+'>'+tit+'</h4>' +
                  '<span class="links">' +
                    '<a href="'+data.url_dossier_senat+'" target="_blank"><span class="glyphicon glyphicon-link"></span> dossier Sénat</a><br/>' +
                    '<a href="'+data.url_dossier_assemblee+'" target="_blank"><span class="glyphicon glyphicon-link"></span> dossier Assemblée</a>' +
                    (data.url_jo ? '<br/><a href="'+data.url_jo+'" target="_blank"><span class="glyphicon glyphicon-link"></span> loi sur Légifrance</a>' : '') +
                  '<span>'
                );
                if (leg) $(".law-title").tooltip();

                scope.stages=[],
                scope.steps=[],
                scope.inst=[];
                var currStage = {name: "", num: 1},
                    currInst  = {name: "", num: 1};
                if (! $rootScope.lawTitle) {
                    $rootScope.lawTitle = data.short_title;
                    $rootScope.pageTitle = ($rootScope.pageTitle+"").replace('undefined', $rootScope.lawTitle);
                }

                data.steps.forEach(function(e,j){
                    if(e.debats_order!==null) scope.total++;
                });
                scope.barwidth = $("#stepsbar").width();

                data.steps.filter(function(e) { return e.debats_order != null; })
                .sort(function(a,b) { return a.debats_order - b.debats_order; })
                .forEach(function(e) {
                    scope.steps.push(e);
                    e.short_name = scope.stepLabel(e);
                    e.long_name = scope.stepLegend(e);
                    e.display_short = (scope.barwidth / scope.total < (e.step == "depot" && e.auteur_depot != "Gouvernement" ? 150 : 120));

                    if (e.step === "depot") {
                        if (currStage.name) currStage.num++;
                        else currStage.name = "depot";
                        if (currStage.num == 2) currStage.name += "s";
                    } else if (currStage.name === e.stage) {
                        currStage.num++;
                    } else {
                        if (currStage.name)
                            scope.stages.push(scope.addStageInst(currStage));
                        currStage.num=1;
                        currStage.name = e.stage;
                    }

                    if ((e.step === "depot" && currInst.name === e.auteur_depot) || (e.step !== "depot" && e.institution === currInst.name))
                        currInst.num++;
                    else {
                        if (currInst.name)
                            scope.inst.push(scope.addStageInst(currInst));
                        currInst.num = 1;
                        currInst.name = (e.step==="depot" ? e.auteur_depot : e.institution);
                    }
                });

                scope.stages.push(scope.addStageInst(currStage));
                scope.inst.push(scope.addStageInst(currInst));
                timer(function(){
                    $(".stb-step span").tooltip({html: true})
                    $(".stb-step a").tooltip({html: true})
                    $(".stb-inst span").tooltip()
                    $(".stb-stage span").tooltip({html: true})
                },0);

            }, function(error) {
                scope.error = error
            })

        }
    }}
]);
