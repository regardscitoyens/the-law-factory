(function () {

    var thelawfactory = window.thelawfactory || (window.thelawfactory = {});

    thelawfactory.utils = {};

    var utils = thelawfactory.utils;
    
    utils.shortNames = {
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
        "cmp": "CMP"
    };

    utils.longNames = {
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
    };

    utils.hashName = function (n) {
        return n.replace(/\W/g, '').toLowerCase();
    };
    
    utils.getShortName = function (l) {
        return (utils.shortNames[utils.hashName(l)] ? utils.shortNames[utils.hashName(l)] : l);
    };
    
    utils.getLongName = function (l) {
        return (utils.longNames[utils.hashName(l)] ? utils.longNames[utils.hashName(l)] : l);
    };

    utils.stepLegend = function (el) {
        if (el.step === "depot") return (el.auteur_depot == "Gouvernement" ? "Projet de Loi" : "Proposition de Loi");
        else return utils.getLongName(el.step);
    };

    utils.stepLabel = function (el) {
        if (el.step === "depot") return (el.auteur_depot == "Gouvernement" ? "PJL" : "PPL");
        return utils.getShortName(el.step);
    };

    utils.clean_amd_subject = function (s) {
        return s.replace(/ART[\.\s]+/i, "Article ")
            .replace(/A(vant|près) A/i, "A$1 l'A");
    };

    utils.slugArticle = function (a) {
        return "art_" + a.toLowerCase()
                .replace("è", "e")
                .replace(/article/, '')
                .replace(/[i1]er?/, '1')
                .trim()
                .replace(/\W/g, '-')
    };

    utils.string_to_slug = function (str) {
        str = str.replace(/^\s+|\s+$/g, ''); // trim
        str = str.toLowerCase();

        // remove accents, swap ñ for n, etc
        var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
        var to = "aaaaeeeeiiiioooouuuunc------";
        for (var i = 0, l = from.length; i < l; i++) {
            str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
        }

        str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
            .replace(/\s+/g, '-') // collapse whitespace and replace by -
            .replace(/-+/g, '-'); // collapse dashes

        return str;
    };

    utils.shortenString = function (s, n) {
        if (s.length > n) {
            s = s.substr(0, s.indexOf(' ', n - 20)) + "…";
        }
        return s;
    };

    utils.adjustColor = function (c) {
        var col = d3.hsl(c);
        if (col.s > 0.5) col.s = 0.5;
        if (col.l < 0.7) col.l = 0.7;
        return col;
    };

    utils.addStageInst = function (currObj) {
        var obj = $.extend(true, {}, currObj);
        obj.long_name = utils.getLongName(obj.name);
        obj.short_name = utils.getShortName(obj.name);
        obj.display_short = (obj.long_name != obj.short_name && utils.barwidth * obj.num / utils.total < (obj.name === "CMP" ? 190 : 130));
        return obj;
    };
    
    utils.slugGroup = function (group) {
        return "g_" + group.replace(/[^a-z]/ig, '');
    };

    utils.goodRound = function (n) {
        if (n && Math.abs(n) < 1)
            return parseFloat(n).toFixed(2).replace('.', ',');
        return parseInt(n);
    };

    utils.getSVGScale = function (t) {
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
    };

    utils.getSVGTranslate = function (t) {
        t = t[0];
        var xforms = t.transform.baseVal,
            firstXForm, i = 0;
        while (i < xforms.numberOfItems) {
            firstXForm = xforms.getItem(i);
            i++;
            if (firstXForm.type == SVGTransform.SVG_TRANSFORM_TRANSLATE)
                return [firstXForm.matrix.e,
                    firstXForm.matrix.f];
        }
        return [0, 0];
    };

    utils.formatDate = function (d) {
        var d2 = d.split('-');
        return d2[2] + "/" + d2[1] + "/" + d2[0];
    };

    utils.getVizHeight = function () {
        return $(window).height() - $("#header-nav").height() - $(".title").height() - $("#menu-left").height() - $("footer").height() - parseInt($(".row").css("margin-bottom")) - 36;
    };

    utils.setModSize = function (elsel, pad) {
        return function () {
            var myheight = utils.getVizHeight();
            $(".text").height(myheight + pad);
            if (elsel == ".main-sc") {
                $(elsel).height(myheight - parseInt($(".labels-sc").css('height')));
                $("#gantt").height($(elsel).height() - $("#legend").height());
            }
            else $(elsel).height(myheight - $(".stages").height() - (pad ? parseInt($(".legend").css('height')) : 0));
        }
    };

    utils.setMod0Size = utils.setModSize(".main-sc", 0);
    utils.setMod1Size = utils.setModSize("#viz", 0);
    utils.setMod2Size = utils.setModSize("#viz", 1);
    utils.setMod2bSize = utils.setModSize("#viz-int", 1);

    utils.spinner = null;
    utils.spinner_opts = {
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

    utils.startSpinner = function (divid) {
        if (utils.spinner != null) return;
        if (!divid) divid = 'preload';
        var target = document.getElementById(divid);
        utils.spinner = new Spinner(utils.spinner_opts);
        $('#' + divid).animate({opacity: 1}, 0, function () {
            utils.spinner.spin(target);
        });
    };

    utils.stopSpinner = function (callback, divid) {
        if (utils.spinner == null) return (callback ? callback() : undefined);
        if (!divid) divid = 'preload';
        $('#' + divid).animate({opacity: 0}, 0, function () {
            utils.spinner.stop();
            utils.spinner = null;
            return (callback ? callback() : undefined);
        });
    };

    utils.drawGroupsLegend = function () {
        var col, type, oncl, ct = 0;
        d3.entries(utils.groups)
            .sort(function (a, b) {
                return a.value.order - b.value.order;
            })
            .forEach(function (d) {
                col = utils.adjustColor(d.value.color);
                type = (d.value.link !== "" ? 'colors' : 'others');
                oncl = ' onclick="thelawfactory.utils.highlightGroup(\'' + d.key + '\');" title="' + d.value.nom + '" data-toggle="tooltip" data-placement="left">';
                $("." + type).append('<div class="leg-item"><div ' + (ct == 3 ? ' id="tuto-legend"' : '') + 'class="leg-value" style="background-color:' + col + '"' + oncl + '</div>' +
                    '<div class="leg-key"' + oncl + d.key + '</div></div>');
                ct++;
            });
        $(".leg-value").tooltip();
        $(".leg-key").tooltip();
    };

    utils.highlightGroup = function (group) {
        if (!e) var e = window.event;
        if (e) {
            e.cancelBubble = true;
            if (e.stopPropagation) e.stopPropagation();
        }
        if (!$('.focused')) {
            if (utils.groups[group]) $("#text-title").html(utils.groups[group].nom);
        }
        $(".legend").on("click", utils.resetHighlight);
        group = "." + utils.slugGroup(group);
        d3.selectAll("path" + group).transition(50).style("fill-opacity", 0.6);
        d3.selectAll("rect" + group).transition(50).style("opacity", 0.9);
        d3.selectAll("path:not(" + group + ")").transition(50).style("fill-opacity", 0.2);
        d3.selectAll("rect:not(" + group + ")").transition(50).style("opacity", 0.2);
    };

    utils.resetHighlight = function (type) {
        if (!e) var e = window.event;
        if (e) {
            e.cancelBubble = true;
            if (e.stopPropagation) e.stopPropagation();
        }
        if ($('.focused').length) {
            d3.selectAll("rect.focused").transition(50).style("opacity", 0.55);
            d3.selectAll("path.focused").transition(50).style("fill-opacity", 0.45);
            d3.selectAll("rect.main-focused").transition(50).style("opacity", 1);
            d3.selectAll("rect:not(.focused)").transition(50).style("opacity", 0.2);
            d3.selectAll("path:not(.focused)").transition(50).style("fill-opacity", 0.2);
        } else {
            $("#text-title").html(utils.vizTitle);
            d3.selectAll("rect").transition(50).style("opacity", 0.9);
            d3.selectAll("path").transition(50).style("fill-opacity", 0.3);
        }
        d3.selectAll(".actv-amd")
            .style("stroke", "none")
            .classed("actv-amd", false);
    };

    utils.drawDivOverElement = function (oElement, sElementClass) {
        var selk = utils.mod == "mod0" ? '#gantt' : '#viz';
        if (oElement.prop('tagName') == 'rect') {
            var oNewElement = oElement.clone(true);
            oNewElement.attr('x', 0).attr('y', 0).attr('style', oElement.parent().attr('style'));
            var scale0 = utils.getSVGScale(oElement.parent());
            var scale1 = utils.getSVGScale(oElement.parent().parent());
            var trans0 = utils.getSVGTranslate(oElement.parent());
            var trans1 = utils.getSVGTranslate(oElement.parent().parent());
            var width = oElement.attr('width') * scale0[0] * scale1[0];
            var height = oElement.attr('height') * scale0[1] * scale1[1];
            var left = $(selk).offset().left +
                parseInt(oElement.attr('x')) * scale0[0] * scale1[0] +
                trans0[0] + trans1[0];
            var top = $(selk).offset().top +
                parseInt(oElement.attr('y')) * scale0[1] * scale1[1] +
                trans0[1] + trans1[1];
        } else if (oElement.prop('tagName') == 'g') {
            var oNewElement = oElement.clone(true);
            var bbox = d3.select(sElementClass)[0][0].getBBox();
            var width = bbox.width;
            var height = bbox.height;
            if (utils.mod == "mod2")
                height += 20;
            var top = $(selk).offset().top + d3.select(sElementClass)[0][0].getBBox().y + parseInt(oElement.attr('data-offset'));
            var left = $(selk).offset().left + bbox.x;
            oNewElement.find('*').each(function () {
                var x = $(this).attr('x');
                $(this).attr('x', x - bbox.x);
                var y = $(this).attr('y');
                $(this).attr('y', y - bbox.y);
            });
        } else {
            console.log("Weird tag given on element: ", oElement, oElement.prop('tagName'));
        }
        var sElementClass = sElementClass.replace('.', '') + '-div';
        var node = '<div class="' + sElementClass + ' div-over-svg" style="position: absolute; top: ' + top + 'px; left : ' + left + 'px; width: ' + width + 'px; height: ' + height + 'px;"><svg id="introsvg"></svg></div>';
        $('body').append(node);
        $("#introsvg").append(oNewElement);
        return '.' + sElementClass;
    };

    utils.getIntroJs = function(data, mod) {
        var tuto = data[mod];
        var step = 1;
        var actions = [];
        for (var id in tuto) {
            if (tuto[id].indexOf('@') != -1) {
                var message = tuto[id].split(' @ ');
                tuto[id] = message[0];
                actions[step] = message[1];
            } else {
                actions[step] = '';
            }
            var infos = tuto[id].split(" = ");
            if (id.substring(0, 4) == '.svg') {
                id = id.substring(4);
                id = $scope.drawDivOverElement($(id), id);
            }
            $(id).attr('data-position', infos[0]);
            $(id).attr('data-tooltipClass', 'tooltip-' + id.replace(/^[#\.]/, "")); // remove selector (first # or .)
            $(id).attr('data-intro', infos[1]);
            $(id).attr('data-step', step++);
        }
        var introjs = introJs().setOptions({
            showBullets: false,
            showStepNumbers: false,
            nextLabel: "suite...",
            prevLabel: "...retour",
            skipLabel: "quitter ce tutoriel",
            doneLabel: "quitter ce tutoriel"
        });

        introjs.onbeforechange(function (e) {
            if ($(e).hasClass('div-over-svg'))
                $('.div-over-svg').show();
            else $('.div-over-svg').hide();
            var data_step = $(e).attr('data-step');
            var acts = actions[data_step].split(' , ');
            $.each(acts, function (index, value) {
                var action = value.split(' = ');
                switch (action[0]) {
                    case 'scrolltop' :
                        $(action[1]).scrollTop(0);
                        break;
                    case 'click' :
                        $(action[1]).css('opacity', 1);
                        try {
                            $(action[1]).d3Click();
                            $(action[1]).click();
                            $(action[1])[0].click();
                        } catch (e) {
                        }
                        break;
                    case 'zoom' :
                        zooming(parseInt(action[1]));
                        break;
                }
            });
        });
        var exit_introjs = function () {
            $('.div-over-svg').remove();
            $(window).scrollTop(0);
            $scope.tutorial = false;
            localStorage.setItem("tuto-" + $scope.mod, "done");
        };
        introjs.onexit(exit_introjs);
        introjs.oncomplete(exit_introjs);
        return introjs;
    };

    utils.setTextContainerHeight = function () {
        var h = $(".text").height() - $("#text-title").outerHeight();
        if (h > 0) $(".text-container").height(h);
        else setTimeout(utils.setTextContainerHeight, 100);
    };

})();