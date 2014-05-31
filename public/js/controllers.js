'use strict';

/* Workaround to trigger click on d3 element */
jQuery.fn.d3Click = function () {
  this.each(function (i, e) {
    var evt = document.createEvent("MouseEvents");
    evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    e.dispatchEvent(evt);
  });
};

/* Controllers */

angular.module('theLawFactory.controllers', ['theLawFactory.config']).
    /*
      Specific controller for the naigation Part.
    */
    controller('navigationCtrl', function($scope, $rootScope) {
      $scope.startTutorial = function() {
        console.log('%c navigationCtrl', 'background-color:gold','broadcasting start tutorial')
        $rootScope.$broadcast('MAIN_CTRL_START_TUTORIAL');
      };
    }).
    controller('mainCtrl', function ($scope, $http, apiService, api, $rootScope, $location, API_ROOT_URL) {

        $rootScope.APIRootUrl = API_ROOT_URL;
        $scope.APIRootUrl = API_ROOT_URL;
        if ($scope.APIRootUrl.substr(-1) != "/") $scope.APIRootUrl += "/";

        $rootScope.static = ($location.path() == '/' || $location.path() == '/a-propos.html');
        $rootScope.error = "";
        $rootScope.display_error = function(e) {
            console.log(e);
            $rootScope.error = e;
            setTimeout(function(){$("#error").css("display", "inline")}, 500);
        }
        $rootScope.back = function() {
            var prevUrl = history.length > 1 ? history.splice(-2)[0] : "/";
            $location.path(prevUrl);
        };

        $scope.mod = null;
        $scope.drawing = false;
        $scope.loi = $location.search()['loi'];
        $scope.etape = $location.search()['etape'];
        $scope.article = $location.search()['article'];
        $scope.action = $location.search()['action'];
        $scope.error = {};

        $scope.setTextContainerHeight = function() {
            $(".text-container").height($(".text").height() - $("#text-title").outerHeight());
        }
        $scope.getVizHeight = function() {
            return $(window).height() - $("#header-nav").height()-$(".title").height()-$("#menu-left").height()-$("footer").height()-parseInt($(".row").css("margin-bottom"))-36;
        }
        $scope.setModSize = function(elsel,pad) {
            return function() {
                var myheight = $scope.getVizHeight();
                $(".text").height(myheight + pad);
                if (elsel == ".main-sc") {
                    $(elsel).height(myheight - parseInt($(".labels-sc").css('height')));
                    $("#gantt").height( $(elsel).height() - $("#legend").height() );
                }
                else $(elsel).height(myheight - $(".stages").height() - (pad ? parseInt($(".legend").css('height')) : 0));
            }
        }
        $scope.setMod0Size = $scope.setModSize(".main-sc", 0)
        $scope.setMod1Size = $scope.setModSize("#viz", 0)
        $scope.setMod2Size = $scope.setModSize("#viz", 1)
        $scope.setMod2bSize = $scope.setModSize("#viz-int", 1)

        $scope.read=false;
        $scope.revs=true;
        $scope.readmode = function() {
            $(".text").css({"width":"93.43%","left":"3.3%"});
            $(".gotomod").addClass('readmode');
            $scope.read=true;
        }
        $scope.viewmode = function() {
            $(".text").css({"width":"23.40%","left":"73.3%"});
            $(".gotomod").removeClass('readmode');
            $scope.read=false;
        }
        $scope.hiderevs = function() {
            $scope.revs=false;
	    return $scope.update_revs_view();
        }
        $scope.showrevs = function() {
            $scope.revs=true;
	    return $scope.update_revs_view();
        }
	$scope.update_revs_view = function() {
	    var d = d3.select('#viz .curr').data()[0];
	    if (utils.revs) {
		$(".art-txt").html(d.textDiff).animate({opacity: 1}, 350);
	    }else{
		$(".art-txt").html(d.originalText).animate({opacity: 1}, 350);
	    }
	}

        $scope.spinner = null;
        $scope.spinner_opts = {
            lines: 13, // The number of lines to draw
            length: 20, // The length of each line
            width: 10, // The line thickness
            radius: 30, // The radius of the inner circle
            corners: 1, // Corner roundness (0..1)
            rotate: 0, // The rotation offset
            direction: 1, // 1: clockwise, -1: counterclockwise
            color: '#bbb', // #rgb or #rrggbb or array of colors
            speed: 1, // Rounds per second
            trail: 60, // Afterglow percentage
            shadow: false, // Whether to render a shadow
            hwaccel: false, // Whether to use hardware acceleration
            className: 'spinner', // The CSS class to assign to the spinner
            zIndex: 2e9, // The z-index (defaults to 2000000000)
            top: '50%', // Top position relative to parent
            left: '50%' // Left position relative to parent
        };

        $scope.startSpinner = function(divid) {
            if ($scope.spinner != null) return;
            if (!divid) divid = 'preload';
            var target = document.getElementById(divid);
            $scope.spinner = new Spinner($scope.spinner_opts);
            $('#'+divid).animate({opacity: 1}, 0 , function() {
                $scope.spinner.spin(target);
            });
        }
        $scope.stopSpinner = function(callback, divid) {
            if ($scope.spinner == null) return (callback ? callback() : undefined);
            if (!divid) divid = 'preload';
            $('#'+divid).animate({opacity: 0}, 0, function() {
                $scope.spinner.stop();
                $scope.spinner = null;
                return (callback ? callback(): undefined);
            });
        }

        $scope.hashName = function(n){
            return n.replace(/\W/g, '').toLowerCase();
        }
        $scope.shortNames = {
            "1relecture": "1<sup>ère</sup> Lect.",
            "2melecture": "2<sup>ère</sup> Lect.",
            "nouvlect": "Nouv. Lect.",
            "ldfinitive": "Lect.&nbsp;Déf.",
            "assemblee": "AN",
            "dputs": "AN",
            "snateurs": "Sénat",
            "senat": "Sénat",
            "gouvernement": "Gouv.",
            "commission": "Com.",
            "hemicycle": "Hém.",
            "depot": "Dépôt",
            "depots": "Dépôts",
            "cmp": "CMP",
        }

        $scope.longNames = {
            "1relecture": "1<sup>ère</sup> Lecture",
            "2melecture": "2<sup>ère</sup> Lecture",
            "nouvlect": "Nouvelle Lecture",
            "ldfinitive": "Lecture Définitive",
            "assemblee": "Assemblée",
            "dputs": "Députés",
            "snateurs": "Sénateurs",
            "senat": "Sénat",
            "gouvernement": "Gouvernement",
            "commission": "Commission",
            "hemicycle": "Hémicyle",
            "depot": "Dépôt",
            "depots": "Dépôts",
            "cmp": "Commission Mixte Paritaire"
        }

        $scope.getShortName = function (l) {
            return ($scope.shortNames[$scope.hashName(l)] ? $scope.shortNames[$scope.hashName(l)] : l);
        }
        $scope.getLongName = function (l) {
            return ($scope.longNames[$scope.hashName(l)] ? $scope.longNames[$scope.hashName(l)] : l);
        }
        $scope.addStageInst = function(currObj) {
            var obj = $.extend(true, {}, currObj);
            obj.long_name = $scope.getLongName(obj.name);
            obj.short_name = $scope.getShortName(obj.name);
            obj.display_short = (obj.long_name != obj.short_name && $scope.barwidth * obj.num / $scope.total < (obj.name === "CMP" ? 190 : 130));
            return obj;
        }
        $scope.stepLegend = function (el){
            if (el.step==="depot") return (el.auteur_depot == "Gouvernement" ? "Projet de Loi" : "Proposition de Loi");
            else return $scope.getLongName(el.step);
        }
        $scope.stepLabel = function (el){
            if(el.step==="depot") return (el.auteur_depot == "Gouvernement" ? "PJL" : "PPL");
            return $scope.getShortName(el.step);
        }

        $scope.clean_amd_subject = function(s) {
            return s.replace(/ART[\.\s]+/i, "Article ")
                .replace(/A(vant|près) A/i, "A$1 l'A");
        }

        $scope.slugArticle = function(a) {
            return "art_" + a.toLowerCase()
                .replace("è", "e")
                .replace(/article/, '')
                .replace(/[i1]er?/, '1')
                .trim()
                .replace(/\W/g, '-')
        }

        $scope.string_to_slug = function (str) {
            str = str.replace(/^\s+|\s+$/g, ''); // trim
            str = str.toLowerCase();

            // remove accents, swap ñ for n, etc
            var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
            var to   = "aaaaeeeeiiiioooouuuunc------";
            for (var i = 0, l = from.length; i < l; i++) {
                str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
            }

            str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
                .replace(/\s+/g, '-') // collapse whitespace and replace by -
                .replace(/-+/g, '-'); // collapse dashes

            return str;
        }

        $scope.shortenString = function(s,n) {
            if (s.length > n) {
                s = s.substr(0, s.indexOf(' ', n-20)) + "…";
            }
            return s;
        }

	    $scope.adjustColor = function(c) {
            var col = d3.hsl(c);
            if (col.s>0.5) col.s = 0.5;
            if (col.l<0.7) col.l = 0.7;
            return col;
        }

        $scope.groups = {};

	    $scope.drawGroupsLegend = function() {
            var col, type, oncl, ct = 0;
            d3.entries($scope.groups)
            .sort(function(a,b) { return a.value.order - b.value.order; })
            .forEach(function(d) {
                col = $scope.adjustColor(d.value.color);
                type = (d.value.link !== "" ? 'colors' : 'others');
                oncl = ' onclick="highlight(\''+d.key+'\');" title="'+d.value.nom+'" data-toggle="tooltip" data-placement="left">';
               $("."+type).append('<div class="leg-item"><div '+(ct == 3 ? ' id="tuto-legend"' : '')+'class="leg-value" style="background-color:'+col+'"' + oncl + '</div>' +
                    '<div class="leg-key"' + oncl + d.key + '</div></div>');
                ct++;
			});
            $(".leg-value").tooltip();
            $(".leg-key").tooltip();
        }

        $scope.highlightGroup = function(group) {
            if (!e) var e = window.event;
            if (e) {
                e.cancelBubble = true;
                if (e.stopPropagation) e.stopPropagation();
            }
            if (!$('.focused')) {
                $(".text-container").empty();
                if ($scope.groups[group]) $("#text-title").html($scope.groups[group].nom);
            }
            $(".legend").on("click", $scope.resetHighlight);
            group = "."+ $scope.slugGroup(group)
            d3.selectAll("path"+group).transition(50).style("fill-opacity",0.6);
            d3.selectAll("rect"+group).transition(50).style("opacity", 0.9);
            d3.selectAll("path:not("+group+")").transition(50).style("fill-opacity",0.2);
            d3.selectAll("rect:not("+group+")").transition(50).style("opacity",0.2);
        }

        $scope.slugGroup = function(group) {
            return "g_" + group.replace(/[^a-z]/ig, '');
        }

        $scope.resetHighlight = function(type) {
            if (!e) var e = window.event;
            if (e) {
                e.cancelBubble = true;
                if (e.stopPropagation) e.stopPropagation();
            }
            if ($('.focused').length) {
                d3.selectAll("rect.focused").transition(50).style("opacity",0.55);
                d3.selectAll("path.focused").transition(50).style("fill-opacity",0.45);
                d3.selectAll("rect.main-focused").transition(50).style("opacity",1);
                d3.selectAll("rect:not(.focused)").transition(50).style("opacity",0.2);
                d3.selectAll("path:not(.focused)").transition(50).style("fill-opacity",0.2);
            } else {
                $(".text-container").empty();
                $("#text-title").html("Sélectionner un "+(type == "amds" ? "amendement" : "groupe d'orateurs"));
                d3.selectAll("rect").transition(50).style("opacity",0.9);
                d3.selectAll("path").transition(50).style("fill-opacity",0.3);
            }
            d3.selectAll(".actv-amd")
                .style("stroke","none")
			    .classed("actv-amd",false);
        }

        $scope.goodRound = function(n){
	       if(n && Math.abs(n) < 1)
		     return parseFloat(n).toFixed(2).replace('.', ',');
           return parseInt(n);
        }

        $scope.getSVGScale = function(t) {
            t = t[0];
            var xforms = t.transform.animVal,
                firstXForm, i = 0;
            while (i < xforms.numberOfItems) {
                firstXForm = xforms.getItem(i);
                i++;
                if (firstXForm.type == SVGTransform.SVG_TRANSFORM_SCALE)
                    return [firstXForm.matrix.a,
                            firstXForm.matrix.d];
            }
            return [1, 1];
        }
        $scope.getSVGTranslate = function(t) {
            t = t[0];
            var xforms = t.transform.baseVal,
                firstXForm, i = 0;
            while (i < xforms.numberOfItems) {
                firstXForm = xforms.getItem(i);
                i++;
                if (firstXForm.type == SVGTransform.SVG_TRANSFORM_TRANSLATE)
                firstXForm = xforms.getItem(0);
                return [firstXForm.matrix.e,
                        firstXForm.matrix.f];
            }
            return [0, 0];
        }
 
        /**
         * Draw a div over the jQuery node passed as argument
         *
         * @param element jQuery node to draw over
         * @return class of the newly created element
         */
        $scope.drawDivOverElement = function(oElement, sElementClass) {
            var selk = $scope.mod=="mod0" ? '#gantt' : '#viz';
            if(oElement.prop('tagName') == 'rect') {
                var oNewElement = oElement.clone(true);
                oNewElement.attr('x', 0).attr('y', 0).attr('style', oElement.parent().attr('style'));
                var scale0 = $scope.getSVGScale(oElement.parent());
                var scale1 = $scope.getSVGScale(oElement.parent().parent());
                var trans0 = $scope.getSVGTranslate(oElement.parent());
                var trans1 = $scope.getSVGTranslate(oElement.parent().parent());
                var width = oElement.attr('width') * scale0[0] * scale1[0];
                var height = oElement.attr('height') * scale0[1] * scale1[1];
                var left = $(selk).offset().left +
                    parseInt(oElement.attr('x')) * scale0[0] * scale1[0] +
                    trans0[0] + trans1[0];
                var top = $(selk).offset().top +
                    parseInt(oElement.attr('y')) * scale0[1] * scale1[1] +
                    trans0[1] + trans1[1];
            } else if(oElement.prop('tagName') == 'g') {
                var oNewElement = oElement.clone(true);
                var width = d3.select(sElementClass)[0][0].getBBox().width;
                var height = d3.select(sElementClass)[0][0].getBBox().height;
                var top = $(selk).offset().top + d3.select(sElementClass)[0][0].getBBox().y + parseInt(oElement.attr('data-offset'));
                var left = $(selk).offset().left + d3.select(sElementClass)[0][0].getBBox().x;
                oNewElement.find('*').each(function() {
                    var x = $(this).attr('x');
                    $(this).attr('x', x - d3.select(sElementClass)[0][0].getBBox().x);
                    var y = $(this).attr('y');
                    $(this).attr('y', y - parseInt(height)/2);
                });
            } else {
                console.log("Weird tag given on element: ", oElement.prop('tagName'));
            }
            var sElementClass = sElementClass.replace('.', '') + '-div';
            var node = '<div class="' + sElementClass + ' div-over-svg" style="position: absolute; top: ' + top + 'px; left : ' + left + 'px; width: ' + width + 'px; height: ' + height + 'px;"><svg id="introsvg"></svg></div>';
            $('body').append(node);
            $("#introsvg").append(oNewElement);
            return '.' + sElementClass;
        }

        $scope.formatDate = function(d) {
            var d2 = d.split('-');
            return d2[2]+"/"+d2[1]+"/"+d2[0];
        }

        /////////////////////////////////////////////////////////////
        $scope.toggleTutorial = function(show) {
            if(!$scope.tutorial && show) {
                $scope.tutorial = true;
                api.getTutorials().then(function(data){
                    var tuto = data[$scope.mod];
                    var step = 1;
                    var actions = [];
                    for(var id in tuto)
                    {
                        if(tuto[id].indexOf('@') != -1) {
                            var message = tuto[id].split(' @ ');
                            tuto[id] = message[0];
                            actions[step] = message[1];
                        } else {
                            actions[step] = '';
                        }
                        var infos = tuto[id].split(" = ");
                        if(id.substring(0, 4) == '.svg') {
                            id = id.substring(4);
                            id = $scope.drawDivOverElement($(id), id);
                        }
                        $(id).attr('data-position', infos[0]);
                        $(id).attr('data-tooltipClass', 'tooltip-' + id.replace(/^[#\.]/,"")); // remove selector (first # or .)
                        $(id).attr('data-intro', infos[1]);
                        $(id).attr('data-step', step++);
                    }
                    var introjs = introJs().setOptions({
                        showBullets: false,
                        showStepNumbers: false,
                        nextLabel:  "suite...",
                        prevLabel:  "...retour",
                        skipLabel:  "quitter ce tutoriel",
                        doneLabel:  "quitter ce tutoriel",
                    });
                    introjs.onbeforechange(function(e) {
                        if ($(e).hasClass('div-over-svg')) 
                            $('.div-over-svg').show();
                        else $('.div-over-svg').hide();
                        var data_step = $(e).attr('data-step');
                        var acts = actions[data_step].split(' , ');
                        $.each(acts, function(index, value) {
                            var action = value.split(' = ');
                            switch(action[0]) {
                                case 'scrolltop' :
                                    $(action[1]).scrollTop(0);
                                    break;
                                case 'click' :
                                    $(action[1]).d3Click();
                                    $(action[1]).click();
                                    try { $(action[1])[0].click(); } catch(e) {}
                                    $(action[1]).css('opacity', 1);
                                    break;
                                case 'zoom' :
                                    zooming(parseInt(action[1]));
                                    break;
                            }
                        });
                    });
                    var exit_introjs = function() {
                        $('.div-over-svg').remove();
                        $(window).scrollTop(0);
                        $scope.tutorial = false;
                        localStorage.setItem("tuto-"+$scope.mod, "done");
                    };
                    introjs.onexit(exit_introjs);
                    introjs.oncomplete(exit_introjs);
                    introjs.start();
                },
                function(error){
                    console.log("couldn't retrieve json tutorial");
                }
                );
            }
        };

        $scope.showFirstTimeTutorial = function() {
            if(!localStorage.getItem("tuto-"+$scope.mod) || localStorage.getItem("tuto-"+$scope.mod)!="done")
                $scope.toggleTutorial(true);
        }
    }
);
