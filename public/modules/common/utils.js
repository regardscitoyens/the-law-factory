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
        "hemicycle": "Hémicycle",
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

    utils.getVizHeight = function () {
        return $(window).height() - $("#header-nav").height() - $(".title").height() - $("#menu-left").height() - $("footer").height() - parseInt($(".row").css("margin-bottom")) - 36;
    };

    var colorMode = localStorage.getItem('colorMode') || 'normal';
    var colorBlindPalette = {
        /* GDR     */ '#ff1e1e': '#dc2200',
        /* SOC     */ '#ff32be': '#ff7f7f',
        /* ECOLO   */ '#00e61e': '#69a12b',
        /* RRDP    */ '#fac384': '#ffcc99',
        /* UDI     */ '#1eb4ff': '#00b7ff',
        /* LES-REP */ '#1e1ec8': '#270098',
        /* NI      */ '#a5a5a5': '#bfbfbf',
        /* GOUV    */ '#cccbb3': '#cccbb3'
    };

    utils.adjustColor = function (c) {
        var col = d3.hsl(c);

        if (colorMode === 'colorblind') {
            return d3.hsl(colorBlindPalette[col.toString()] || col.toString());
        } else {
            if (col.s > 0.5) col.s = 0.5;
            if (col.l < 0.7) col.l = 0.7;
            return col;
        }
    };

    utils.toggleColorBlind = function() {
        localStorage.setItem('colorMode', colorMode == 'normal' ? 'colorblind' : 'normal');
        location.reload();
    };

    utils.slugGroup = function (group) {
        return "g_" + group.replace(/[^a-z]/ig, '');
    };

    utils.cleanAmdSubject = function (s) {
        return s.replace(/ART[\.\s]+/i, "Article ")
            .replace(/A(vant|pr?s) A/i, "A$1 l'A");
    };

    utils.spinner = (function() {
        var self = {},
            currentSpinner,
            spinnerOpts = {
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

        self.start = function (divid) {
            if (currentSpinner != null) return;
            if (!divid) divid = 'preload';
            var target = document.getElementById(divid);
            currentSpinner = new Spinner(spinnerOpts);
            $('#' + divid).animate({opacity: 1}, 0, function () {
                currentSpinner.spin(target);
            });
        };

        self.stop = function (callback, divid) {
            if (currentSpinner == null) return (callback ? callback() : undefined);
            if (!divid) divid = 'preload';
            $('#' + divid).animate({opacity: 0}, 0, function () {
                currentSpinner.stop();
                currentSpinner = null;
                return (callback ? callback() : undefined);
            });
        };

        return self;
    })();

    utils.drawGroupsLegend = function (groups) {
        var col, type, oncl, tip, ct = 0;
        d3.entries(groups)
            .sort(function (a, b) {
                return a.value.order - b.value.order;
            })
            .forEach(function (d) {
                col = utils.adjustColor(d.value.color);
                type = (d.value.link !== "" ? 'colors' : 'others');
                oncl = ' onclick="highlight(\'' + d.key + '\');">';
                tip = ' title="' + d.value.nom + '" data-toggle="tooltip" data-placement="left"';
                $("." + type).append('<div class="leg-item"' + tip + '><div ' + (ct == 3 ? ' id="tuto-legend"' : '') + 'class="leg-value" style="background-color:' + col + '"' + oncl + '</div>' +
                    '<div class="leg-key"' + oncl + d.key + '</div></div>');
                ct++;
            });
        $(".leg-item").tooltip({container:'body'});
    };

    utils.highlightGroup = function (vizTitle, helpText, groups, group) {
        if (!e) var e = window.event;
        if (e) {
            e.cancelBubble = true;
            if (e.stopPropagation) e.stopPropagation();
        }
        if (!$('.focused')) {
            $(".text-container").empty().html(helpText);
            if (groups[group]) $("#text-title").html(groups[group].nom);
        }
        $(".legend").on("click", function() { utils.resetHighlight(vizTitle, helpText); });
        group = "." + utils.slugGroup(group);
        d3.selectAll("path" + group).transition(50).style("fill-opacity", 0.6);
        d3.selectAll("rect" + group).transition(50).style("opacity", 0.9);
        d3.selectAll("path:not(" + group + ")").transition(50).style("fill-opacity", 0.2);
        d3.selectAll("rect:not(" + group + ")").transition(50).style("opacity", 0.2);
    };

    utils.resetHighlight = function (vizTitle, helpText) {
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
            $(".text-container").empty().html(helpText);
            $("#text-title").html(vizTitle);
            d3.selectAll("rect").transition(50).style("opacity", 0.9);
            d3.selectAll("path").transition(50).style("fill-opacity", 0.3);
        }
        d3.selectAll(".actv-amd")
            .style("stroke", "none")
            .classed("actv-amd", false);
    };

    utils.accentMap = {
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

    utils.clean_accents = function (term) {
        var ret = "";
        for (var i = 0; i < term.length; i++) {
            ret += utils.accentMap[term.charAt(i)] || term.charAt(i);
        }
        return ret;
    };

    utils.opacity_amdts = function (d) {
        if (d > 1000) d = 1000;
        return 0.05 + 0.75 * d / 1000;
    };

    utils.opacity_mots = function (d) {
        if (d > 100000) d = 100000;
        return 0.05 + 0.75 * d / 100000;
    };

    utils.upperFirst = function (s) {
        return (!s ? "" : s.charAt(0).toUpperCase() + s.substring(1));
    };
})();