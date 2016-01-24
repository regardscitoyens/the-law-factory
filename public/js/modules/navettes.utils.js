var drawGantt, navettesScope,
    locale = d3.locale({
        decimal: ",",
        thousands: ".",
        grouping: [3],
        currency: ["€", ""],
        dateTime: "%a %b %e %X %Y",
        date: "%d/%m/%Y",
        time: "%H:%M:%S",
        periods: ["AM", "PM"],
        days: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
        shortDays: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
        months: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
        shortMonths: ["Janv.", "Fév.", "Mars", "Avril", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."]
    }),
    selected_bill = "",
    allAmendments = ["Tout nb d'amendements", 'Aucun amendement', 'Moins de 50 amendements', 'Plus de 50 amendements'],
    active_filters,
    reset_filters = function () {
        active_filters = {
            year: 2013,
            theme: "",
            length: '',
            amendments: allAmendments[3]
        };
    },
    refreshLengthFilter = function () {
        if (active_filters['length'])
            $(".bar-step #mois_" + active_filters['length']).addClass('filtered_month');
    },
    addBillsFilter = function (filtype, filval) {
        if (filtype == "length") $(".bar-value.filtered_month").removeClass('filtered_month');
        active_filters[filtype] = filval;
        drawGantt('filter');
    },
    rmBillsFilter = function (filtype) {
        addBillsFilter(filtype, "");
    },
    cleanBillsFilter = function () {
        active_filters = {year: "", theme: "", length: "", amendments: ""};
        refreshLengthFilter();
    };
reset_filters();

(function () {

    var thelawfactory = window.thelawfactory || (window.thelawfactory = {});

    var setNavettesSize = thelawfactory.utils.setModSize(".main-sc", 0),
        goodRound = function (n) {
            if (n && Math.abs(n) < 1)
                return parseFloat(n).toFixed(2).replace('.', ',');
            return parseInt(n);
        };

    thelawfactory.navettes = function () {

        function vis(data, APIRootUrl, vizTitle, helpText) {
            navettesScope = $('.navettes').scope();
            var drawing = false,
                legendcontainer = d3.select("#legend").append("svg"),
                ganttcontainer = d3.select("#gantt").append("svg").attr("id", "modOsvg"),
                lawscont, grid,
                currFile,
                steps, laws,
                gridrects, gridlines,
                allThemes = [], allYears = [],
                dossiers = [], smallset = [],
                stats = {},
                mindate, maxdate, maxduration,
                tscale, ticks,
                minheight,
                width,
                width_ratio = 1,
                lawh = 50,
                steph = lawh - 16,
                z = 1,
                layout = "t",
                maxstat = 24,binstat = 30,
                get_stat_bin = function (v) {
                    return Math.min(maxstat, Math.ceil((v - 1) / binstat)) * binstat;
                },
                sortByLeng = function (a, b) {
                    return b.total_days - a.total_days
                },
                sortByAmds = function (a, b) {
                    return b.total_amendements - a.total_amendements
                },
                sortByDate = function (a, b) {
                    return Date.parse(b.end) - Date.parse(a.end)
                },
                sort_function = sortByDate,
                format = d3.time.format("%Y-%m-%d"),
                tickform = locale.timeFormat("%b %Y"),
                tickpresence = function (v) {
                    return d3.scale.linear().range([v, 1]).domain([1, 7]).clamp(true);
                },
                format_title = function (d) {
                    d = d.replace('depot', 'Dépôt')
                        .replace('1ère lecture', '1<sup>ère</sup> Lecture')
                        .replace('2ème lecture', '2<sup>ème</sup> Lecture')
                        .replace('nouv. lect.', 'Nouvelle Lecture')
                        .replace('l. définitive', 'Lecture Définitive')
                        .replace('CMP', 'Commission Mixte Paritaire')
                        .replace('hemicycle', 'Hémicycle')
                        .replace('constitutionnalité', 'Conseil Constitutionnel')
                        .replace('assemblee', 'Assemblée nationale')
                        .replace('senat', 'Sénat');
                    return thelawfactory.utils.upperFirst(d);
                },
                french_date = function (d) {
                    if (!d) return "";
                    d = d.split('-');
                    return [d[2], d[1], d[0]].join('/');
                },
                popover = function (d) {
                    var title = ((d.institution == "assemblee" || d.institution == "senat") && layout == 'q' ? format_title(d.institution) + " — " : "") + format_title(d.step ? d.step : d.stage),
                        div = d3.select(document.createElement("div")).style("width", "100%").attr('class', 'pop0');
                    if (d.stage == "CMP") {
                        div.append("p").html(title);
                        title = format_title(d.stage);
                    } else if (d.step) {
                        if (d.step == "depot" && d.debats_order != null) {
                            title = "Dépôt — " + d.auteur_depot;
                            div.append("p").html("Pro" + (d.auteur_depot == "Gouvernement" ? "jet" : "position") + " de loi");
                        }
                    }
                    div.append("p").html('<span class="glyphicon glyphicon-calendar"></span><span> ' + french_date(d.date) + (d.enddate && d.enddate != d.date ? " →  " + french_date(d.enddate) : '') + '</span>');
                    if (d.echec || d.decision) {
                        div.append("p").html((d.echec ? d.echec : d.decision).toUpperCase());
                    }
                    if ((d.institution == "assemblee" || d.institution == "senat") && d.nb_amendements) {
                        div.append("p").style("vertical-align", "middle").html(d.nb_amendements + " amendement" + (d.nb_amendements > 1 ? 's' : ''));
                    }
                    return {
                        title: title,
                        content: div,
                        placement: "mouse",
                        gravity: "bottom",
                        displacement: [-105, 8],
                        mousemove: true
                    };
                };

            function scaled_date_val(e) {
                var val = e.date;
                if (e.overlap) {
                    var mydate = format.parse(e.date),
                        dd = mydate.getDate() + e.overlap,
                        mm = mydate.getMonth() + 1,
                        y = mydate.getFullYear();
                    val = y + "-" + mm + "-" + dd;
                }
                return format.parse(val);
            }

            thelawfactory.navettes.zooming = function (lvl) {
                var perc = ($("#gantt").scrollLeft() + $("#gantt").width() / 2) / (width * z);
                if ($("#gantt").scrollLeft() == 0 && $("#gantt").scrollTop() == 0) {
                    if (layout == 't') {
                        perc = 1;
                    } else if (layout == 'a') {
                        perc = 0;
                    }
                }
                if (layout === "q") return;
                if (d3.event && d3.event.scale) z = d3.event.scale;
                else if (lvl) z = lvl;
                else z = 1;
                $("#navettes-slider").slider("value", z);

                d3.selectAll(".steps").attr("transform", "scale(" + z + ",1)");
                d3.selectAll(".law-bg").attr("transform", "scale(" + z + ",1)");
                d3.selectAll(".lawline").attr("transform", "scale(" + z + ",1)");
                d3.selectAll(".tl-bg").attr("transform", "scale(" + z + ",1)");

                if (layout === "a") {
                    d3.selectAll(".g-law").attr("transform", function (d, i) {
                        return "translate(" + -tscale(format.parse(d.beginning)) * z + 5 + "," + (i * (20 + lawh)) + ")";
                    });
                    var lscale = d3.time.scale().range([0, width * width_ratio]);
                    lscale.domain([mindate, maxdate]);
                    d3.selectAll(".tick").attr("x1", function (d) {
                        return lscale(d) * z
                    }).attr("x2", function (d) {
                        return lscale(d) * z
                    });
                    d3.selectAll(".tick-lbl").attr("x", function (d) {
                        return lscale(d) * z;
                    });
                    var rat = Math.ceil(4 * maxduration / width / width_ratio);
                    d3.selectAll(".tick-lbl").style("opacity", function (d, i) {
                        return (i % Math.round(tickpresence(rat)(z)) == 0 && lscale(d) + 60 / z < width ? 1 : 0);
                    });

                } else if (layout == "t") {
                    d3.selectAll(".tick").attr("x1", function (d) {
                        return tscale(d) * z
                    }).attr("x2", function (d) {
                        return tscale(d) * z
                    });
                    d3.selectAll(".tick-lbl").attr("x", function (d) {
                        return tscale(d) * z;
                    });
                    rat = Math.ceil((maxdate - mindate) / 21600000 / width / width_ratio);
                    d3.selectAll(".tick-lbl").style("opacity", function (d, i) {
                        return (i % Math.round(tickpresence(rat)(z)) == 0 && tscale(d) + 60 / z < width ? 1 : 0);
                    });
                }
                if (z > 1) $(".navettes #gantt").css('cursor', 'move');
                else $(".navettes #gantt").css('cursor', 'default');

                legendcontainer.attr("width", width * z);
                ganttcontainer.attr("width", width * z);

                $("#gantt").scrollLeft(perc * width * z - $("#gantt").width() / 2);
            };


            drawGantt = function (action) {
                setNavettesSize();
                thelawfactory.utils.setTextContainerHeight();
                width = parseInt(d3.select("#gantt").style("width")) - 30;
                minheight = $("#gantt").height() - 50;
                setTimeout(computeFilters, 50);
                if (action == 'reset') {
                    navettesScope.loi = null;
                    reset_filters();
                    action = 'filter';
                }
                thelawfactory.utils.spinner.start();
                $("#gantt svg").animate({opacity: 0}, 50, function () {
                    updateGantt(action);
                    thelawfactory.utils.spinner.stop(function () {
                        $("#gantt svg").animate({opacity: 1}, 50);
                    });
                });
            };

            var updateGantt = function (action) {
                $("#gantt svg").empty();
                $("#legend svg").empty();
                $("#bars").empty();
                var resize = (action == "resize");
                if (resize) action = "";
                else unclick();

                refreshLengthFilter();
                var zoo = $("#navettes-slider").attr('value'),
                    scroll = {scrollTop: "0px", scrollLeft: "0px"};
                lawscont = ganttcontainer.append("g").attr("class", "laws");
                grid = ganttcontainer.insert('g', ':first-child').attr("class", "grid");
                $("#legend").height(35);
                setNavettesSize();
                if (!action) action = navettesScope.action;
                if (!action) action = 'time';
                if (action == 'time') {
                    layout = "t";
                    zoo = 1;
                    action = 'sortd';
                    $("#display_menu .chosen").removeClass('chosen');
                    $("#display_menu #dm-time").addClass('chosen');
                    $("#menu-sort .dropdown-toggle").addClass('disabled');
                    $("#menu-zoom").css('opacity', 1);
                } else if (action == 'absolute') {
                    layout = "a";
                    zoo = 1;
                    action = 'sortl';
                    $("#display_menu .chosen").removeClass('chosen');
                    $("#display_menu #dm-absolute").addClass('chosen');
                    $("#menu-sort .dropdown-toggle").removeClass('disabled');
                    $("#menu-zoom").css('opacity', 1);
                } else if (action == 'quanti') {
                    layout = "q";
                    zoo = 1;
                    action = 'sorta';
                    $("#display_menu .chosen").removeClass('chosen');
                    $("#display_menu #dm-quanti").addClass('chosen');
                    $("#menu-sort .dropdown-toggle").removeClass('disabled');
                    $("#menu-zoom").css('opacity', 0);
                }
                if (action == 'filter') {
                    zoo = 1;
                    action = 'sortd';
                    if ($("#display_order #do-length").hasClass('chosen'))
                        action = 'sortl';
                    if ($("#display_order #do-amds").hasClass('chosen'))
                        action = 'sorta';
                }
                if (action == 'sortl') {
                    $("#menu-sort .selectedchoice").text("durée");
                    $("#display_order .chosen").removeClass('chosen');
                    $("#display_order #do-length").addClass('chosen');
                    sort_function = sortByLeng;
                } else if (action == 'sorta') {
                    $("#menu-sort .selectedchoice").text("amdts");
                    $("#display_order .chosen").removeClass('chosen');
                    $("#display_order #do-amds").addClass('chosen');
                    sort_function = sortByAmds;
                } else if (action == 'sortd') {
                    $("#menu-sort .selectedchoice").text("date");
                    $("#display_order .chosen").removeClass('chosen');
                    $("#display_order #do-date").addClass('chosen');
                    sort_function = sortByDate;
                } else scroll = null;
                if (!active_filters['amendments'])
                    $("#menu-amendments .selectedchoice").text(allAmendments[0]);
                else $("#menu-amendments .selectedchoice").text(active_filters['amendments']);
                if (!active_filters['year'])
                    $("#menu-years .selectedchoice").text(allYears[0]);
                else $("#menu-years .selectedchoice").text("Étudié en " + active_filters['year']);
                if (active_filters['theme'])
                    $("#menu-themes .selectedchoice").text("Thème : " + active_filters['theme']);
                else $("#menu-themes .selectedchoice").text("Tous les thèmes");
                drawLaws();
                if (resize && selected_bill) onclick(selected_bill);
                drawAxis();
                if (layout == "t") {
                    $("#menu-display .selectedchoice").text('chronologique');
                    timePosition();
                } else if (layout == "a") {
                    $("#menu-display .selectedchoice").text('comparative');
                    absolutePosition();
                }
                if (layout == "q") {
                    $("#legend").height(0);
                    setNavettesSize();
                    $("#menu-display .selectedchoice").text('quantitative');
                    quantiPosition();
                    drawLabels();
                } else d3.select("#gantt").on("scroll", function () {
                    d3.select(".timeline").attr("transform", "translate(-" + $(this).scrollLeft() + ", 0)");
                    d3.selectAll(".law-name").attr("transform", "translate(" + $(this).scrollLeft() + ", 0)");
                });
                thelawfactory.navettes.zooming(zoo);
                if (scroll && !resize) $("#gantt").animate(scroll);
            };

            function prepareSteps(steps, id) {
                steps.forEach(function (e, j) {
                    if (e.stage === "constitutionnalité" || e.institution === "conseil constitutionnel")
                        e.stepname = "CC";
                    else if (e.stage === "promulgation")
                        e.stepname = "JO";
                    else if (e.step !== "depot" && (e.institution === "assemblee" || e.institution === "senat"))
                        e.stepname = e.step.substr(0, 3).toUpperCase();
                    else if (e.step === "depot")
                        e.stepname = id.substr(0, 3).toUpperCase();
                    else if (e.institution === "CMP")
                        e.stepname = "CMP";

                    if (e.date && e.date != "" && e.enddate < e.date) e.enddate = e.date;
                    if (!e.date || e.date === "") e.date = e.enddate;

                    if (j > 0 && steps[j - 1].enddate == e.date) {
                        if (steps[j - 1].overlap) e.overlap = steps[j - 1].overlap + 1;
                        else e.overlap = 1
                    } else if (j > 0 && steps[j - 1].overlap) {
                        var pastdate = format.parse(steps[j - 1].enddate),
                            dd = pastdate.getDate() + steps[j - 1].overlap,
                            mm = pastdate.getMonth() + 1,
                            y = pastdate.getFullYear();
                        if (mm < 10) mm = "0" + mm;
                        if (dd < 10) dd = "0" + dd;

                        // Monitor Overlaps
                        if (y + "-" + mm + "-" + dd >= e.date) {
//                                    console.log("OVERLAP:",e.date,y+"-"+mm+"-"+dd)
                            e.overlap = steps[j - 1].overlap + 1;
                        }
                    }

                    if (j != 0 && e.step == "depot") e.qw = -3;
                    else e.qw = getQwidth(e);
                    if (j == 0) e.qx = 5;
                    else e.qx = steps[j - 1].qx + steps[j - 1].qw + 3;
                })
            }

            function prepareData() {
                data.dossiers.forEach(function (d) {
                    if (!d.timesteps) {
                        d.timesteps = angular.copy(d.steps);
                        d.quantisteps = angular.copy(d.steps);

                        var remove = [];
                        d.timesteps.forEach(function (s, j) {
                            if ((s.step === 'hemicycle' && d.timesteps[j - 1].stage != 'l. définitive') || (s.step === 'depot' && j)) {
                                remove.unshift(j);
                                if (s.step === 'hemicycle') {
                                    d.timesteps[j - 1].enddate = s.enddate;
                                    d.timesteps[j - 1].nb_amendements += s.nb_amendements;
                                    d.timesteps[j - 1].step = s.institution;
                                }
                            }

                        });
                        remove.forEach(function (id) {
                            d.timesteps.splice(id, 1);
                        });

                        prepareSteps(d.timesteps, d.id);
                        prepareSteps(d.quantisteps, d.id);
                    }
                });
                dossiers = dossiers.concat(data.dossiers)
            }

            // function used for multiple data files - progressive loading
            function dynamicLoad() {
                d3.json(APIRootUrl + currFile, function (error, json) {
                    data = json;
                    prepareData();
                    currFile = json.next_page;
                    setTimeout((currFile ? dynamicLoad : drawGantt), 50);
                })
            }

            // Populate themes, years and amendments in filter menu
            function computeFilters() {
                var y1, hashYears = {};
                if (!allYears.length) {
                    dossiers.forEach(function (l) {
                        allThemes = allThemes.concat(l.themes.join(',').replace(/ et /g, ',').split(','));
                        y1 = l.beginning.substr(0, 4);
                        hashYears[y1] = true;
                        y1 = l.end.substr(0, 4);
                        hashYears[y1] = true;
                    });
                    allYears[0] = "Toutes années";
                    var ihashYear, hashYearsLen = hashYears.length;
                    for (ihashYear = 0; ihashYear < hashYearsLen; ++ihashYear) {
                        allYears.push(ihashYear);
                    }
                    allYears.sort();
                    allYears.reverse();
                    allThemes = allThemes.filter(function (itm, i, a) {
                        return i == a.indexOf(itm);   // unify
                    });
                    allThemes.sort(function (a, b) {
                        var ac = thelawfactory.utils.clean_accents(a),
                            bc = thelawfactory.utils.clean_accents(b);
                        return (ac === bc ? 0 : (ac < bc ? -1 : 1))
                    });
                    allThemes.unshift('Tous les thèmes');
                }
                var construct_menu_filter = function (filter, cssid, d, i) {
                    if (!i) {
                        if (active_filters[filter] == d || !active_filters[filter]) {
                            $(cssid).append("<li><a class='chosen' onclick=\"rmBillsFilter('" + filter + "','')\">" + d.toLowerCase() + '</a></li>');
                        } else {
                            $(cssid).append("<li><a onclick=\"rmBillsFilter('" + filter + "','" + active_filters[filter] + "')\">" + d.toLowerCase() + '</a></li>');
                        }
                    } else if (active_filters[filter] == d) {
                        $(cssid).append("<li><a class='chosen' onclick=\"rmBillsFilter('" + filter + "','" + d + "')\">" + d.toLowerCase() + '</a></li>');
                    } else {
                        $(cssid).append("<li><a onclick=\"addBillsFilter('" + filter + "','" + d + "')\">" + d.toLowerCase() + '</a></li>');
                    }
                };
                $("#years").empty();
                allYears.forEach(function (d, i) {
                    construct_menu_filter('year', '#years', d, i);
                });
                $("#themes").empty();
                allThemes.forEach(function (d, i) {
                    construct_menu_filter('theme', '#themes', d, i);
                });
                $("#amendments").empty();
                allAmendments.forEach(function (d, i) {
                    construct_menu_filter('amendments', '#amendments', d, i);
                });
            }

            function drawAxis() {

                if (!smallset.length) return ganttcontainer.append("g")
                    .append("text")
                    .attr("x", parseInt(d3.select("#gantt").style("width")) * 0.5)
                    .attr("y", 120)
                    .style("fill", "#716259")
                    .attr("font-size", "1.5em")
                    .attr("text-anchor", "middle")
                    .text("Aucun résultat trouvé avec ces filtres, veuillez en supprimer un.");

                if (layout == "q") return;
                var tl = legendcontainer.append("g")
                    .attr("class", "timeline");
                tl.append("rect")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", width)
                    .attr("class", "tl-bg")
                    .attr("height", 30)
                    .style("fill", "white")
                    .style("stroke", "none");
                tl.append("rect")
                    .attr("x", 0)
                    .attr("y", 30)
                    .attr("width", width)
                    .attr("class", "tl-bg")
                    .attr("height", 2)
                    .style("fill", "grey")
                    .style("opacity", 0.3)
                    .style("stroke", "none");

                var tk = tl.selectAll(".tick-lbl")
                    .data(ticks).enter();
                tk.append("text")
                    .attr("class", "tick-lbl")
                    .style("font-size", "13px")
                    .style("fill", "#716259")
                    .attr("y", 20)
                    .attr("x", function (d) {
                        return tscale(d);
                    })
                    .text(function (d) {
                        return tickform(d);
                    })
            }

            function drawLaws() {
                // filter and sort laws
                if (navettesScope.loi) {
                    $('.viewonelaw').show();
                    $('.noviewonelaw').hide();
                    cleanBillsFilter();
                    smallset = dossiers.filter(function (d) {
                        return d.id == navettesScope.loi;
                    });
                    if (!smallset.length) {
                        var matcher = new RegExp($.ui.autocomplete.escapeRegex(thelawfactory.utils.clean_accents(navettesScope.loi)), "i");
                        smallset = dossiers.filter(function (value) {
                            value = thelawfactory.utils.clean_accents(value.Titre + " " + value.id + " " + value["Thèmes"] + " " + value.short_title);
                            return matcher.test(thelawfactory.utils.clean_accents(value));
                        });
                    }
                } else {
                    $('.viewonelaw').hide();
                    $('.noviewonelaw').show();
                    smallset = dossiers
                        .filter(function (d) {
                            if (!active_filters['theme']) return true;
                            return (d.themes.join(',').indexOf(active_filters['theme'])) != -1;
                        })
                        .filter(function (d) {
                            if (!active_filters['year']) return true;
                            return d.beginning.substr(0, 4) <= active_filters['year'] && d.end.substr(0, 4) >= active_filters['year'];
                        })
                        .filter(function (d) {
                            if (!active_filters['length']) return true;
                            return active_filters['length'] == get_stat_bin(d.total_days);
                        })
                        .filter(function (d) {
                            if (!active_filters['amendments']) return true;
                            switch (active_filters['amendments']) {
                                case allAmendments[1]:
                                    return !d.total_amendements;
                                    break;
                                case allAmendments[2]:
                                    return d.total_amendements && d.total_amendements < 51;
                                    break;
                                case allAmendments[3]:
                                    return d.total_amendements > 50;
                                    break;
                            }
                        })
                        .sort(sort_function);
                }

                // find date range
                for (var i = 1; i <= maxstat; i++) stats[binstat * i] = 0;
                mindate = "";
                maxdate = "";
                maxduration = 0;
                smallset.forEach(function (d) {
                    mindate = (mindate && mindate < d.beginning ? mindate : d.beginning);
                    maxdate = (maxdate && maxdate > d.end ? maxdate : d.end);
                    maxduration = Math.max(maxduration, d.total_days);
                    stats[get_stat_bin(d.total_days)]++;
                });
                drawStats();
                if (smallset.length == 0) {
                    ganttcontainer.attr("height", minheight).attr("width", width);
                    legendcontainer.attr("width", width);
                    return;
                }

                if (layout == "q") {
                    maxdate = format.parse(mindate > data.min_date ? data.min_date : mindate);
                    maxdate.setDate(maxdate.getDate() + maxduration + 50);
                } else maxdate = format.parse(maxdate > data.max_date ? data.max_date : maxdate);
                mindate = format.parse(mindate < data.min_date ? data.min_date : mindate);
                maxdate.setDate(maxdate.getDate() + 10);

                //update svg size
                if (layout == "a")
                    width_ratio = 0.95 * (maxdate - mindate) / (maxduration * 86400000.);
                else width_ratio = 1;

                ganttcontainer.attr("height", Math.max(minheight, smallset.length * (20 + lawh)))
                    .attr("width", width)
                    .on("click", unclick);
                legendcontainer.attr("width", width);

                ticks = d3.time.months(mindate, maxdate, 1);
                tscale = d3.time.scale().range([0, width]);
                tscale.domain([mindate, maxdate]);

                //add containing rows
                gridrects = lawscont.selectAll(".lawline")
                    .data(smallset).enter()
                    .append("rect")
                    .attr("class", function (d) {
                        return "lawline " + d.id;
                    })
                    .attr("x", 0)
                    .attr("y", function (d, i) {
                        return i * (20 + lawh);
                    })
                    .attr("opacity", 0.3)
                    .attr("width", width)
                    .attr("height", 20 + lawh - 4)
                    .style("fill", "transparent");

                //add single law group

                laws = lawscont.selectAll(".g-law")
                    .data(smallset).enter()
                    .append("g")
                    .attr("class", function (d) {
                        return "g-law " + d.id;
                    })
                    .attr("transform", function (d, i) {
                        return "translate(0," + (i * (20 + lawh)) + ")";
                    })
                    .classed("g-law-first", function (d, i) {
                        return (i == 0);
                    })
                    .on("click", onclick);


                //single law background rectangle
                if (layout != "q") laws.append("rect")
                    .attr("x", function (d) {
                        return tscale(format.parse(d.beginning));
                    })
                    .attr("y", 28)
                    .attr("width", function (d) {
                        return Math.max(0, tscale(format.parse(d.end)) - tscale(format.parse(d.beginning)));
                    })
                    .attr("class", "law-bg")
                    .attr("height", steph)
                    .attr("opacity", 0.3).style("fill", "#d8d1c9")
                    .popover(function () {
                        var popover_content = d3.select(document.createElement('div')).style("width", "100%").attr('class', 'pop0');
                        popover_content.append('p');
                        return {
                            title: "Interruption parlementaire",
                            content: popover_content,
                            placement: "mouse",
                            gravity: "bottom",
                            displacement: [-105, 8],
                            mousemove: true
                        };
                    });
                $(".law-bg").hover(function () {
                    $('.popover').addClass("IP")
                });

                //addsingle law steps
                laws.append("g")
                    .attr("class", "steps")
                    .selectAll("step")
                    .data(function (d) {
                        d.steps = d[layout === 'q' ? 'quantisteps' : 'timesteps'];
                        return d.steps.filter(function (d, i) {
                            return i == 0 || layout != "q" || d.step != "depot";
                        });
                    })
                    .enter()
                    .append("rect")
                    .attr("class", color_step)
                    .classed('step', true)
                    .attr("x", function (e) {
                        return tscale(scaled_date_val(e));
                    })
                    .attr("y", 28)
                    .attr("width", getQLwidth)
                    .attr("height", steph)
                    .popover(popover);
                $(".step").hover(function (d) {
                    $('.popover').addClass(color_step(d.target.__data__))
                });

                //add labels
                ganttcontainer.selectAll(".law-name")
                    .data(smallset).enter()
                    .append("text")
                    .attr("x", parseInt(d3.select("#gantt").style("width")) * 0.5)
                    .attr("y", function (d, i) {
                        return i * (20 + lawh) + 17;
                    })
                    .attr("class", "law-name").text(function (e) {
                        return e.short_title;
                    })
                    .style("fill", "#716259")
                    .attr("font-size", "0.9em")
                    .attr("text-anchor", "middle")
                    .on("click", function (d) {
                        if (layout === "t") {
                            var posx = tscale(format.parse(d.beginning)) * z - 15;
                            $("#gantt").animate({scrollLeft: posx + "px"});
                        }
                        else $("#gantt").animate({scrollLeft: 0 + "px"});
                        onclick(d);
                    });

                //recompute vertical grid to match new height
                d3.selectAll(".tick").remove();

                gridlines = grid.selectAll(".tick")
                    .data(ticks).enter();

                gridlines.append("line")
                    .attr("class", "tick")
                    .attr("x1", function (e) {
                        return tscale(e)
                    })
                    .attr("y1", 0)
                    .attr("x2", function (e) {
                        return tscale(e)
                    })
                    .attr("y2", smallset.length * (20 + lawh))
                    .attr("stroke", "#ddd")
                    .attr("stroke-width", 1)
                    .attr("opacity", 0.6);
                if (navettesScope.loi) {
                    onclick(smallset[0]);
                }
            }

            function drawLabels() {
                d3.selectAll(".g-law").append("g").attr("class", "lbls")
                    .selectAll(".step-lbl")
                    .data(function (d) {
                        return d.steps.filter(function (d, i) {
                            return i == 0 || layout != "q" || d.step != "depot";
                        });
                    })
                    .enter()
                    .append("g")
                    .attr("class", "step-lbl")
                    .each(function (d) {
                        for (var j = 0; j < d.stepname.length; j++) {
                            d3.select(this).append("text")
                                .attr("x", d.qx + 3)
                                .attr("y", 38 + j * 9)
                                .attr("dx", 5)
                                .text(d.stepname[j]);
                        }
                        d3.select(this).append("rect")
                            .attr("class", "step-lbl-r")
                            .style("fill", "transparent")
                            .attr("x", d.qx)
                            .attr("y", 28)
                            .attr("width", d.qw)
                            .attr("height", steph)
                            .popover(popover);
                    });
                $(".step-lbl-r").hover(function (d) {
                    $('.popover').addClass(color_step(d.target.__data__))
                });
            }


            function getQwidth(e) {
                if (e.stage === "promulgation" || e.step == "depot") return 15;
                var diff = format.parse(e.enddate) - format.parse(e.date);
                return Math.max(15, Math.floor(35 * Math.log(diff / 86400000)));
            }

            function getQLwidth(e) {
                if (e.stage === "promulgation") return 3;
                if (e.date === "") e.date = e.enddate;
                var val = tscale(format.parse(e.enddate)) - tscale(format.parse(e.date));
                return (val >= 3 ? val - 2 : 1);
            }

            function color_step(d, i) {
                if (d.institution === "CMP") return "CMP";
                if (i == 0 && d.stepname === "PJL") return "PJL";
                if (d.institution === "assemblee") return "AN";
                if (d.institution === "senat") return "SE";
                if (d.institution === "conseil constitutionnel") return "CC";
                if (d.stage === "promulgation") return "PR";
                return "Color_Default";
            }

            var classicPosition = function () {
                d3.selectAll(".step")
                    .attr("x", function (e) {
                        return tscale(scaled_date_val(e));
                    })
                    .attr("width", getQLwidth);
            };

            var absolutePosition = function () {
                d3.selectAll(".g-law").transition().duration(500).attr("transform", function (d, i) {
                    return "translate(" + -tscale(format.parse(d.beginning)) * z * width_ratio + 5 + "," + (i * (20 + lawh)) + "), scale(" + width_ratio + ",1)";
                });
                classicPosition();
                d3.selectAll(".tick-lbl").text(function (d, j) {
                    return (j + 1) + " mois";
                })
            };

            var timePosition = function () {
                classicPosition();
                d3.selectAll(".tick-lbl").text(function (d) {
                    return tickform(d);
                });
            };

            var quantiPosition = function () {
                d3.selectAll('.steps').selectAll(".step")
                    .attr("x", function (d) {
                        return d.qx;
                    })
                    .attr("width", function (d) {
                        return Math.max(0, d.qw);
                    });

                d3.selectAll(".tick").style('opacity', 0);
                d3.selectAll(".law-bg").transition().duration(500).style("opacity", 0);
            };

            function unclick() {
                selected_bill = "";
                $("#text-title").text(vizTitle);
                $("#text-title").attr('data-original-title', "").tooltip('fixTitle');
                $(".text-container").empty().html(helpText);
                d3.selectAll(".g-law").style("opacity", 1);
            }

            function onclick(d) {
                if (d3.event) d3.event.stopPropagation();
                selected_bill = d;
                d3.selectAll(".g-law").style("opacity", 0.2);
                d3.select(".g-law." + d.id).style("opacity", 1);

                $("#text-title").text(d.short_title);
                $("#text-title").attr('data-original-title', d.long_title).tooltip('fixTitle');
                thelawfactory.utils.setTextContainerHeight();

                var textContent = '';
                textContent += '<p><span class="glyphicon glyphicon-calendar"></span>&nbsp;&nbsp;' + french_date(d.beginning) + " →  " + french_date(d.end) + '</p>';
                textContent += '<div class="gotomod"><a id="explore" class="btn btn-info" href="articles.html?loi=' + d.id + '">Explorer les articles</a></div>';
                if (d.procedure != "Normale") textContent += '<p>(procédure accélérée)</p>';
                d.steps.forEach(function (e) {
                    if (e.decision === "partiellement conforme") textContent += '<p>(censure partielle par le Conseil Constitutionnel)</p>';
                });

                var extrainfo = '<div class="extrainfos">';
                extrainfo += '<ul class="badges-list">';
                extrainfo += '<li data-toggle="tooltip" title="Total d\'amendements déposés" data-placement="bottom">';
                extrainfo += '<div class="badge badge-tlf">';
                extrainfo += '<div class="badge-prefix">' + (d.total_amendements ? d.total_amendements : '0') + '</div>';
                extrainfo += '<div class="badge-icon icon-AmD" ';
                extrainfo += '></div>';
                extrainfo += '</div>';
                extrainfo += '<h7>Amdts Déposés </h7>';
                extrainfo += '</li>';

                /* Badge for Parlamentaries Amendments adopted */


                var tauxSuccesAmdt = d.total_amendements == 0 ? 0 : goodRound(100 * (d.total_amendements_adoptes / (d.total_amendements + 0.0)));
                extrainfo += '<li data-toggle="tooltip" title="Taux d\'adoption des amendements" data-placement="bottom">';
                extrainfo += '<div class="badge badge-tlf">';
                extrainfo += '<div class="badge-prefix">' + tauxSuccesAmdt + '&nbsp;%</div>';
                extrainfo += '<div class="badge-icon icon-AmPA"';
                extrainfo += '></div>';
                extrainfo += '</div>';
                extrainfo += '<h7>Amdts Adoptés</h7>';
                extrainfo += '</li>';


                /* Badge for evolution of law volume */

                var volumeEvo = d.input_text_length2 ? goodRound(100 * ((d.output_text_length2 - d.input_text_length2) / (d.input_text_length2 + 0.0))) : 0;
                extrainfo += '<li data-toggle="tooltip" title="Taux d\'évolution de la taille globale du texte de loi en nombre de caractères" data-placement="bottom">';
                extrainfo += '<div class="badge badge-tlf">';
                extrainfo += '<div class="badge-prefix">' + (volumeEvo > 0 ? "+" : "") + volumeEvo + '&nbsp;%</div>';
                extrainfo += '<div class="badge-icon icon-volume-1"';
                extrainfo += '></div>';
                extrainfo += '</div>';
                extrainfo += '<h7>Taille du texte</h7>';
                extrainfo += '</li>';

                /*Badge Nelson*/
                /* Badge for volume */
                /*
                 extrainfo += '<li data-toggle="tooltip" title="Evolution volumétrique du projet de loi" data-placement="bottom">';
                 extrainfo += '<div class="badge badge-tlf">'
                 extrainfo += '<div class="badge-prefix">30</div>';
                 extrainfo += '<div class="badge-icon icon-volume-1"'

                 extrainfo += '></div>';
                 extrainfo += '</div>';
                 extrainfo += '</li>';
                 */

                /*****/

                /* Badge for incidents in process */

                /* Badge for modification of law */
                extrainfo += '<li data-toggle="tooltip" title="Taux de modification du texte originel" data-placement="bottom">';
                extrainfo += '<div class="badge badge-tlf">';
                extrainfo += '<div class="badge-prefix">' + goodRound(100 * d.ratio_texte_modif) + '&nbsp;%</div>';
                extrainfo += '<div class="badge-icon icon-balance"';
                extrainfo += '></div>';
                extrainfo += '</div>';
                extrainfo += '<h7>Modif. du texte</h7>';
                extrainfo += '</li>';


                /* Badge for incidents in process */

                /*extrainfo += '<li data-toggle="tooltip" title="Incidents" data-placement="bottom">'
                 extrainfo += '<div class="badge badge-tlf">'
                 extrainfo += '<div class="badge-prefix">30</div>';
                 extrainfo += '<div class="badge-icon icon-warning"'
                 extrainfo += '></div>';
                 extrainfo += '</div>';

                 extrainfo += '</li>';*/


                /* Badge for duration of legislative process */

                /*extrainfo += '<li>';
                 extrainfo += '<div class="badge badge-tlf">'
                 extrainfo += '<div class="badge-prefix">30</div>';
                 extrainfo += '<div class="badge-icon icon-balance"></div>';
                 extrainfo += '</div>';
                 extrainfo += '<h7>Amendements Parlementaires adoptés</h7>'
                 extrainfo += '</li>';*/

                var mots = (Math.round(d.total_mots / 1000.) + "" ).replace(/\B(?=(\d{3})+(?!\d))/g, "&nbsp;").replace(/^0/, '');

                extrainfo += '<li class="last" data-toggle="tooltip" title="Total de mots prononcés durant les débats parlementaires" data-placement="bottom">';
                extrainfo += '<div class="badge badge-tlf">';
                extrainfo += '<div class="badge-prefix">' + mots + ' 000</div>';
                extrainfo += '<div class="badge-icon icon-QO"';
                extrainfo += '></div>';
                extrainfo += '</div>';
                extrainfo += '<h7>Mots en Débats</h7>';

                extrainfo += '</li>';
                extrainfo += '</ul>';

                var themes = "<p>";
                d.themes.join(",").replace(/ et /g, ',').split(',').forEach(function (e) {
                    themes += "<a onclick=\"addBillsFilter('theme','" + e + "')\" class='badge' title='Filtrer les textes correspondant à ce thème' data-toggle='tooltip' data-placement='left'><span class='glyphicon glyphicon-tag'></span> " + e + "</a>&nbsp;&nbsp;";
                });
                extrainfo += themes + "</p>";

                extrainfo += '<p class="sources">';
                extrainfo += '<small>';
                extrainfo += '<a href="' + d.url_dossier_senat + '" target="_blank"><span class="glyphicon glyphicon-link"></span> dossier Sénat</a> &nbsp; &nbsp; ';
                extrainfo += '<a href="' + d.url_dossier_assemblee + '" target="_blank"><span class="glyphicon glyphicon-link"></span> dossier Assemblée</a>';
                extrainfo += d.url_jo ? '<br/><a href="' + d.url_jo + '" target="_blank"><span class="glyphicon glyphicon-link"></span> loi sur Légifrance</a>' : '';
                extrainfo += ' &nbsp; &nbsp; <a href="' + APIRootUrl + d.id + '/" target="_blank"><span class="glyphicon glyphicon-link"></span> OpenData</a>';
                extrainfo += ' / <a href="http://git.lafabriquedelaloi.fr/parlement/' + d.id + '/" target="_blank">Git</a>';
                extrainfo += '</small>';
                extrainfo += '</p>';
                extrainfo += '</div>';

                textContent += extrainfo;

                $(".text-container").empty().html(textContent);
                $('.badges-list li').tooltip();
                $("a.badge").tooltip();
            }

            function drawStats() {

                $(".labels-sc h5").html(
                    active_filters['length'] ?
                    "Supprimer le filtre sur les textes de " + (active_filters['length'] / 30 + " mois").replace("24 mois", "2 ans et +") :
                        "Filtrer par durée d'adoption des textes"
                );

                var margin_top = 10,
                    text_height = 35,
                    height = $(".labels-sc").height() - parseInt($(".labels-sc h5").css("height")) - margin_top,
                    barcontainer = d3.select("#bars"),
                    m = d3.max(d3.values(stats)),
                    bscale = d3.scale.linear().range([0, height - text_height]);
                bscale.domain([0, m]);

                d3.entries(stats).forEach(function (e) {
                    var label = (e.key == maxstat * binstat ? '2&nbsp;ans et&nbsp;+' : e.key / binstat + " mois"),
                        step = barcontainer
                            .append("div")
                            .attr("class", "bar-step")
                            .attr("style", "width: " + 95 / (maxstat + 1) + "%; margin-right: " + 5 / (maxstat + 1) + "%; margin-top:" + margin_top + "px;");
                    if (active_filters['length'] && active_filters['length'] != e.key)
                        step.style("height", (height - text_height) + "px")
                            .on('click', function () {
                                rmBillsFilter('length');
                            });

                    step.append("div")
                        .attr("id", "mois_" + e.key)
                        .attr("class", (active_filters['length'] == e.key ? "filtered_month " : "") + "bar-value")
                        .attr("style", "height:" + bscale(e.value) + "px; width:100%; top:" + bscale(m - e.value) + "px")
                        .on('click', function () {
                            if (active_filters['length'] == e.key) rmBillsFilter('length');
                            else addBillsFilter('length', e.key);
                        }).popover(function () {
                            var popover_content = d3.select(document.createElement('div')).style("width", "100%").attr('class', 'pop0'),
                                plural = (e.value > 1 ? 's' : '');
                            popover_content.append('p').html(active_filters['length'] == e.key ? 'Supprimer le filtre' : 'Cliquer pour filtrer sur ces textes');
                            return {
                                title: e.value + ' texte' + plural + ' adopté' + plural + ' en ' + label.replace(/&nbsp;/g, ' '),
                                content: popover_content,
                                placement: "mouse",
                                displacement: [-105, -135],
                                gravity: "top",
                                mousemove: true
                            };
                        });

                    if (e.key < 10)
                        label = "&nbsp;&nbsp;&nbsp;" + label;
                    if (e.key == 1 || e.key == 7 || e.key == 11)
                        label = "&nbsp;&nbsp;&nbsp;" + label;

                    step.append("div")
                        .attr("class", "bar-key")
                        .attr("style", "top:" + (bscale(m - e.value) + 5) + "px; font-size:" + d3.min([(parseInt(barcontainer.style("width")) / maxstat), 8]) + "px; height:" + text_height + "px;")
                        .html(label);
                });
            }

            //Start drawing first sample
            $(document).ready(function () {
                prepareData();
                currFile = data.next_page;
                $("a.badge").tooltip();
                setTimeout((currFile ? dynamicLoad : drawGantt), 0);
                $("#text-title").tooltip();
                $(window).resize(function () {
                    if (drawing || $(".view").scope().mod != "navettes") return;
                    drawing = true;
                    setTimeout(function () {
                        drawGantt("resize");
                        drawing = false;
                    }, 350);
                });
            });
        }

        return vis;
    }
})();
