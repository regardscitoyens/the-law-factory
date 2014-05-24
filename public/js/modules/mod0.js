var drawGantt, utils,
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
    active_filters = {
        year: 2013,
        theme: "",
        length: '',
        amendments: 'plus de 50'
    },
    refreshBillsFilter = function(){
        var label;
        for (var k in active_filters) {
            if (active_filters[k]) {
                label = active_filters[k];
                switch(k) {
                    case 'length' :
                        $(".bar-step #mois_"+active_filters[k]).addClass('filtered_month');
                        label = (label/30 + " mois").replace("24 mois", "2 ans et +");
                        type = 'durée';
                        break;
                    case 'theme' :
                        type = 'thème';
                        break;
                    case 'year' :
                        type = 'année';
                        break;
                    case 'amendments' :
                        type = 'amendements';
                        break;
                }
                $("ul.filters li."+k).html("<a onclick=\"rmBillsFilter('"+k+"')\" class='badge' title='Supprimer ce filtre' data-toggle='tooltip' data-placement='right'><span class='glyphicon glyphicon-remove-sign'></span> <b>"+type+":</b> "+label+'</a>');
            } else $("ul.filters li."+k).empty();
        }
    },
    addBillsFilter = function(filtype, filval){
        if (filtype == "length") $(".bar-value.filtered_month").removeClass('filtered_month');
        active_filters[filtype]=filval;
        drawGantt('filter');
    },
    rmBillsFilter = function(filtype){ addBillsFilter(filtype,""); },
    cleanBillsFilter = function(){
        active_filters = {year: "", theme: "", length: "", amendments: ""}
        refreshBillsFilter();
    };

(function () {

    var thelawfactory = window.thelawfactory || (window.thelawfactory = {});

    thelawfactory.mod0 = function () {

        function vis(selection) {

            //Initialization
            utils = $('.mod0').scope();
            var legendcontainer = d3.select("#legend").append("svg"),
                ganttcontainer = d3.select("#gantt").append("svg"),
                lawscont, grid,
                popover, currFile,
                steps, laws,
                gridrects, gridlines,
                allThemes = [], allYears = [],
                dossiers = [], smallset = [],
                stats = {},
                mindate, maxdate, maxduration,
                tscale, ticks,
                width = parseInt(d3.select("#gantt").style("width")) - 30,
                width_ratio = 1,
                lawh = 50,
            steph = lawh - 16,
                z = 1,
                layout = "t",
                maxstat = 24, binstat = 30,
            get_stat_bin = function(v) { return Math.min(maxstat, Math.ceil((v - 1) / binstat)) * binstat; },
            sortByLeng = function(a,b) { return b.total_days - a.total_days },
            sortByAmds = function(a,b) { return b.total_amendements - a.total_amendements },
            sortByDate = function(a,b) { return Date.parse(b.end) - Date.parse(a.end) },
            sort_function = sortByDate,
            format = d3.time.format("%Y-%m-%d"),
            tickform = locale.timeFormat("%b %Y"),
            tickpresence=d3.scale.linear().range([6,1]).domain([1,7]).clamp(true),
            format_title = function(d){
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
                return upperFirst(d);
            },
            french_date = function(d){
                if (!d) return "";
                d = d.split('-');
                return [d[2], d[1], d[0]].join('/');
            },
            popover = function(d) {
                var ydisp = -45,
                title = ((d.institution=="assemblee" || d.institution=="senat") && layout == 'q' ? format_title(d.institution) + " — " : "") + format_title(d.step ? d.step : d.stage),
                    div = d3.select(document.createElement("div")).style("width", "100%").attr('class', 'pop0');
                if (d.stage=="CMP") {
                    div.append("p").html(title);
                    title = format_title(d.stage);
                    ydisp -= 20;
                } else if (d.step) {
                    if (d.step == "depot" && d.debats_order != null)
                        title = "Pro" + (d.auteur_depot == "Gouvernement" ? "jet" : "position") + " de loi" + " — " + d.auteur_depot;
                    div.append("p").html(format_title(d.stage));
                    ydisp -= 20;
                }
                div.append("p").html('<span class="glyphicon glyphicon-calendar"></span><span> '+french_date(d.date) + (d.enddate && d.enddate != d.date ? " →  "+ french_date(d.enddate) : '')+'</span>');
                if (d.echec) div.append("p").html(d.echec.toUpperCase());
                if (d.decision) div.append("p").html(d.decision.toUpperCase());
                if ((d.institution=="assemblee" || d.institution=="senat") && d.nb_amendements) {
                    div.append("p").style("vertical-align", "middle").html(d.nb_amendements+" amendement"+(d.nb_amendements > 1 ? 's' : ''));
                    ydisp -= 22;
                }
                return {
                    title: title,
                    content: div,
                    placement: "mouse",
                    gravity: "right",
                    displacement: [10, ydisp],
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

            zooming = function(lvl) {

                var perc=($("#gantt").scrollLeft()+$("#gantt").width()/2)/(width*z);
                if(layout==="q") return;
                if(d3.event && d3.event.scale) z = d3.event.scale;
                else if(lvl) z=lvl;
                else z=1;
                $("#mod0-slider").slider("value", z);

                d3.selectAll(".steps").attr("transform", "scale(" + z + ",1)");
                d3.selectAll(".law-bg").attr("transform", "scale(" + z + ",1)");
                d3.selectAll(".row").attr("transform", "scale(" + z + ",1)");
                d3.selectAll(".tl-bg").attr("transform", "scale(" + z + ",1)");

                d3.selectAll(".tick").attr("x1",function(d){return tscale(d)*z}).attr("x2",function(d){return tscale(d)*z});
                if(layout==="a") {
                    d3.selectAll(".g-law").attr("transform", function(d,i){return "translate(" + -tscale(format.parse(d.beginning)) * z + 5 + "," + (i * (20 + lawh)) +")"; });
                    lscale = d3.time.scale().range([0, width * width_ratio]);;
                    lscale.domain([mindate, maxdate]);
                    d3.selectAll(".tick-lbl").attr("x", function (d) { return lscale(d) * z; });
                    d3.selectAll(".tick-lbl").style("opacity",function(d,i){
                        return (i % Math.round(tickpresence(z))==0 && lscale(d)*z< width*z - 50 ? 1 : 0);
                    });
                    
                } else {
                    d3.selectAll(".tick-lbl").attr("x", function (d) { return tscale(d) * z; });
                    d3.selectAll(".tick-lbl").style("opacity",function(d,i){
                        return (i % Math.round(tickpresence(z))==0 && tscale(d)*z< width*z - 50 ? 1 : 0);
                    });
                }

                legendcontainer.attr("width", width * z * width_ratio);
                ganttcontainer.attr("width", width * z);

                $("#gantt").scrollLeft(perc * width * z - $("#gantt").width() / 2 );

            };

            function initGanttSVG() {
                lawscont = ganttcontainer.append("g").attr("class", "laws");
                grid = ganttcontainer.insert('g', ':first-child').attr("class", "grid");
            }

            selection.each(function (data) {

                drawGantt = function(action) {
                    setTimeout(computeFilters, 50);
                    if (!action) action = 'time';
                    utils.startSpinner();
                    $("#gantt svg").animate({opacity: 0}, 200, function() {
                        updateGantt(action);
                        utils.stopSpinner(function() {
                            $("#gantt svg").animate({opacity: 1}, 500);
                        });
                    });
                }

                updateGantt = function(action) {
                    $("#gantt svg").empty();
                    $("#legend svg").empty();
                    $("#bars").empty();
                    $("#text-title").text("Sélectionner un texte");
                    $(".text-container").empty();
                    refreshBillsFilter();
                    var zoo = $("#mod0-slider").attr('value'),
                        scroll = {scrollTop: "0px", scrollLeft: "0px"};
                    initGanttSVG();
                    if (action == 'time') {
                        layout = "t";
                        zoo = 1;
                        action = 'sortd';
                        scroll['scrollLeft'] = "100000px";
                        $("#display_menu .chosen").removeClass('chosen');
                        $("#display_menu #dm-time").addClass('chosen');
                        $(".ctrl-sort").hide(400);
                        $(".ctrl-zoom").show(400);
                    } else if (action == 'absolute') {
                        layout = "a";
                        zoo = 1;
                        action = 'sortl';
                        $("#display_menu .chosen").removeClass('chosen');
                        $("#display_menu #dm-absolute").addClass('chosen');
                        $(".ctrl-sort").show(400);
                        $(".ctrl-zoom").show(400);
                    } else if (action == 'quanti') {
                        layout = "q";
                        zoo = 1;
                        action = 'sorta';
                        $("#display_menu .chosen").removeClass('chosen');
                        $("#display_menu #dm-quanti").addClass('chosen');
                        $(".ctrl-sort").show(400);
                        $(".ctrl-zoom").hide(400);
                    }
                    if (action == 'filter') {
                        zoo = 1;
                        action = 'sortd';
                        if ($("#display_order #do-length").hasClass('chosen'))
                            action = 'sortl';
                        if ($("#display_order #do-amds").hasClass('chosen'))
                            action = 'sorta';
                        if (layout == "t") scroll['scrollLeft'] = "100000px";
                    } else $(".text-container").empty();
                    if (action == 'sortl') {
                        $("#display_order .chosen").removeClass('chosen');
                        $("#display_order #do-length").addClass('chosen');
                        sort_function = sortByLeng;
                    } else if (action == 'sorta') {
                        $("#display_order .chosen").removeClass('chosen');
                        $("#display_order #do-amds").addClass('chosen');
                        sort_function = sortByAmds;
                    } else if (action == 'sortd') {
                        $("#display_order .chosen").removeClass('chosen');
                        $("#display_order #do-date").addClass('chosen');
                        sort_function = sortByDate;
                    } else scroll = null;
                    drawLaws();
                    drawAxis();
                    if (layout == "t") timePosition();
                    if (layout == "a") absolutePosition();
                    if (layout == "q") {
                        quantiPosition();
                        drawLabels();
                    } else d3.select("#gantt").on("scroll", function (e) {
                        d3.select(".timeline").attr("transform", "translate(-" + $(this).scrollLeft() + ", 0)");
                        d3.selectAll(".law-name").attr("transform", "translate(" + $(this).scrollLeft() + ", 0)");
                    });
                    zooming(zoo);
                    if (scroll) $("#gantt").animate(scroll);
                }

                function prepareSteps(steps, id) {
                        steps.forEach(function (e, j) {
                            if(e.stage==="constitutionnalité" || e.institution==="conseil constitutionnel")
                                e.stepname="CC";
                            else if (e.stage==="promulgation")
                                e.stepname="JO";
                            else if(e.step!=="depot" && (e.institution==="assemblee" || e.institution==="senat"))
                                e.stepname = e.step.substr(0, 3).toUpperCase();
                            else if(e.step==="depot")
                                e.stepname= id.substr(0,3).toUpperCase();
                            else if(e.institution==="CMP")
                                e.stepname = "CMP";

                            if (e.date && e.date != "" && e.enddate < e.date) e.enddate = e.date
                            if (!e.date || e.date === "") e.date = e.enddate;

                            if (j>0 && steps[j-1].enddate == e.date) {
                                if (steps[j-1].overlap) e.overlap=steps[j-1].overlap+1;
                                else e.overlap=1
                            } else if (j>0 && steps[j-1].overlap) {
                                var pastdate=format.parse(steps[j-1].enddate),
                                    dd = pastdate.getDate()+steps[j-1].overlap,
                                    mm = pastdate.getMonth()+1,
                                    y = pastdate.getFullYear();
                                if (mm<10) mm="0"+mm;
                                if (dd<10) dd="0"+dd;

                                // Monitor Overlaps
                                if (y+"-"+mm+"-"+dd>=e.date) {
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
                    data.dossiers.forEach(function (d, i) {
			if (!d.timesteps) {
			    d.timesteps = angular.copy(d.steps);
			    d.quantisteps = angular.copy(d.steps);
			    
			    var remove = [];
                            d.timesteps.forEach(function(s, j) {
				if ((s.step === 'hemicycle' && d.timesteps[j-1].stage != 'l. définitive') || (s.step === 'depot' && j)) {
                                    remove.unshift(j);
				    if (s.step === 'hemicycle') {
					d.timesteps[j-1].enddate = s.enddate;
					d.timesteps[j-1].nb_amendements += s.nb_amendements;
					d.timesteps[j-1].step = s.institution;
				    }
				}

                            });
                            remove.forEach(function(id, j) {
				d.timesteps.splice(id, 1);
                            });
			
			    prepareSteps(d.timesteps, d.id);
			    prepareSteps(d.quantisteps, d.id);
			}
                    })
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
                    var y1;
                    dossiers.forEach(function(l,i){
                        allThemes = allThemes.concat(l.themes.join(',').replace(/ et /g, ',').split(','));
                        y1 = l.beginning.substr(0,4)-2000;
                        if (!allYears[y1])
                            allYears[y1] = true;
                        y1 = l.end.substr(0,4)-2000;
                        if (!allYears[y1])
                            allYears[y1] = true;
                        allAmendments = ['aucun', 'moins de 50', 'plus de 50'];
                    });
                    $("#years").empty();
                    allYears.forEach(function(d,i){
                        if (d) $("#years").append("<li><a onclick=\"addBillsFilter('year',"+(i+2000)+")\">"+(i+2000)+'</a></li>');
                    });
                    allThemes = allThemes.filter(function(itm,i,a){
                        return i==a.indexOf(itm);   // unify
                    });
                    allThemes.sort(function(a,b){
                        var ac = clean_accents(a),
                            bc = clean_accents(b);
                        return (ac === bc ? 0 : (ac < bc ? -1 : 1))
                    });
                    $("#themes").empty();
                    allThemes.forEach(function(d){
                        $("#themes").append("<li><a onclick=\"addBillsFilter('theme','"+d+"')\">"+d+'</a></li>');
                    });
                    $("#amendments").empty();
                    allAmendments.forEach(function(d){
                        $("#amendments").append("<li><a onclick=\"addBillsFilter('amendments','"+d+"')\">"+d+'</a></li>');
                    });
                }

                function drawAxis() {

                    if (!smallset.length) return ganttcontainer.append("g")
                        .append("text")
                        .attr("x", parseInt(d3.select("#gantt").style("width")) * 0.5)
                        .attr("y", 120)
                        .style("fill", "#333")
                        .attr("font-size", "1.5em")
                        .attr("text-anchor", "middle")
                        .text("Aucun résultat trouvé avec ces filtres, veuillez en supprimer un.");

                    if (layout == "q") return;
                    var tl = legendcontainer.append("g")
                        .attr("class", "timeline")
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
                        .style("fill-opacity", 0.3)
                        .style("stroke", "none");

                    var tk = tl.selectAll(".tick-lbl")
                        .data(ticks).enter();
                    tk.append("text")
                        .attr("class", "tick-lbl")
                        .attr("y", 20)
                        .attr("x", function (d) { return tscale(d); })
                        .text(function (d) { return tickform(d); })
                }

                function drawLaws() {
                    // filter and sort laws
                    if (utils.loi) {
                        cleanBillsFilter();
                        smallset = dossiers.filter(function(d) { return d.id==utils.loi; });
                    } else smallset = dossiers
                        .filter(function(d){
                            if (!active_filters['theme']) return true;
                            return (d.themes.join(',').indexOf(active_filters['theme'])) != -1;
                        })
                        .filter(function(d){
                            if (!active_filters['year']) return true;
                            return d.beginning.substr(0,4) <= active_filters['year'] && d.end.substr(0,4) >= active_filters['year'];
                        })
                        .filter(function(d){
                            if (!active_filters['length']) return true;
                            return active_filters['length'] == get_stat_bin(d.total_days);
                        })
                        .filter(function(d){
                            if (!active_filters['amendments']) return true;
                            switch(active_filters['amendments']) {
                                case 'aucun':
                                    return !d.total_amendements; break;
                                case 'moins de 50':
                                    return d.total_amendements && d.total_amendements < 51; break;
                                case 'plus de 50':
                                    return d.total_amendements > 50; break;
                            };
                        })
                        .sort(sort_function);

                    // find date range
                    for (i = 1; i <= maxstat; i++) stats[binstat*i] = 0;
                    mindate = ""; maxdate = ""; maxduration = 0;
                    smallset.forEach(function(d){
                        mindate = (mindate && mindate < d.beginning ? mindate : d.beginning);
                        maxdate = (maxdate && maxdate > d.end ? maxdate : d.end);
                        maxduration = Math.max(maxduration, d.total_days);
                        stats[get_stat_bin(d.total_days)]++;
                    });
                    setTimeout(drawStats, 50);
                    if (smallset.length == 0) {
                        ganttcontainer.attr("height", 3*(20 + lawh)).attr("width", width);
                        legendcontainer.attr("width", width);
                        return;
                    }

                    if (layout == "q") {
                        maxdate = format.parse(mindate > data.min_date ? data.min_date : mindate);
                        maxdate.setDate(maxdate.getDate() + maxduration + 50);
                    } else maxdate = format.parse(maxdate > data.max_date ? data.max_date : maxdate);
                    mindate = format.parse(mindate < data.min_date ? data.min_date : mindate);
                    mindate.setDate(mindate.getDate() - 10);
                    maxdate.setDate(maxdate.getDate() + 10);

                    //update svg size
                    if (layout == "a")
                        width_ratio = 0.8*(maxdate - mindate)/(maxduration*86400000.);
                    else width_ratio = 1;

                    ganttcontainer.attr("height", Math.max(2, smallset.length) * (20 + lawh)).attr("width", width);
                    legendcontainer.attr("width", width);

                    ticks = d3.time.months(mindate, maxdate, 1);
                    tscale = d3.time.scale().range([0, width]);
                    tscale.domain([mindate, maxdate]);

                    //add containing rows
                    gridrects = lawscont.selectAll(".row")
                        .data(smallset).enter()
                        .append("rect")
                        .attr("class", function (d) { return "row " + d.id; })
                        .attr("x", 0)
                        .attr("y", function (d, i) { return i * (20 + lawh); })
                        .attr("opacity", 0.3)
                        .attr("width", width)
                        .attr("height", 20 + lawh - 4)
                        .style("fill", "#f3efed")

                    //add single law group

                    laws = lawscont.selectAll(".g-law")
                        .data(smallset).enter()
                        .append("g")
                        .attr("class", function (d) { return "g-law " + d.id; })
                        .attr("transform", function (d, i) { return "translate(0," + (i * (20 + lawh)) + ")"; })
                        .on("click", onclick);

                    //single law background rectangle
                    if (layout != "q") laws.append("rect")
                        .attr("x", function (d) { return tscale(format.parse(d.beginning)); })
                        .attr("y", 28)
                        .attr("width", function (d) { return Math.max(0, tscale(format.parse(d.end)) - tscale(format.parse(d.beginning))); })
                        .attr("class", "law-bg")
                        .attr("height", steph)
                        .attr("opacity", 0.3).style("fill", "#d8d1c9");

                    //addsingle law steps
                    steps = laws.append("g")
                        .attr("class", "steps")
                        .selectAll("step")
                        .data(function (d) { d.steps = d[layout === 'q' ? 'quantisteps' : 'timesteps'] ; return d.steps.filter(function(d, i){ return i == 0 || layout != "q" || d.step != "depot";} ); })
                        .enter()
                        .append("g")
                        .attr("class", "g-step")
                        .popover(popover);

                    steps.append("rect")
                        .attr("class", color_step)
		        .classed('step', true)
                        .attr("x", function (e) { return tscale(scaled_date_val(e)); })
                        .attr("y", 28)
                        .attr("width", getQLwidth)
                        .attr("height", steph);

                    //add labels
                    ganttcontainer.selectAll(".law-name")
                        .data(smallset).enter()
                        .append("text")
                        .attr("x", parseInt(d3.select("#gantt").style("width")) * 0.5)
                        .attr("y", function (d, i) { return i * (20 + lawh) + 17; })
                        .attr("class", "law-name").text(function (e) { return e.short_title; })
                        .style("fill", "#333")
                        .attr("font-size", "0.9em")
                        .attr("text-anchor", "middle")
                        .on("click", function (d) {
                            if (layout === "t") {
                                var posx = tscale(format.parse(d.beginning)) * z - 15;
                                $("#gantt").animate({ scrollLeft: posx + "px" });
                            }
                            else $("#gantt").animate({ scrollLeft: 0 + "px" });
                            onclick(d);
                        });

                    //recompute vertical grid to match new height
                    d3.selectAll(".tick").remove();

                    gridlines = grid.selectAll(".tick")
                        .data(ticks).enter();

                    gridlines.append("line")
                    .attr("class", "tick")
                        .attr("x1", function(e){return tscale(e)})
                        .attr("y1", 0)
                        .attr("x2", function(e){return tscale(e)})
                        .attr("y2", smallset.length * (20 + lawh))
                        .attr("stroke", "#ddd")
                        .attr("stroke-width", 1)
                        .attr("opacity", 0.6);
                    if (utils.loi) {
                        onclick(smallset[0]);
                        utils.loi = null;
                    }
                }

		
                function drawLabels() {
                    d3.selectAll(".g-law").append("g").attr("class", "lbls")
                        .selectAll(".step-lbl")
                        .data(function (d) { return d.steps.filter(function(d, i){ return i == 0 || layout != "q" || d.step != "depot";} ); })
                        .enter()
                        .append("g")
                        .attr("class", "step-lbl")
                        .each(function(d,i){
                            for(var j = 0; j<d.stepname.length; j++) {
                                d3.select(this).append("text")
                                    .attr("x", d.qx + 3)
                                    .attr("y", 38+j*9)
                                    .attr("dx", 5)
                                    .text(d.stepname[j])
                                    .popover(popover);
                            }
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
                };
				
                classicPosition = function() {
                    d3.selectAll(".step")
                        .attr("x", function (e) { return tscale(scaled_date_val(e)); })
                        .attr("width", getQLwidth);
                }

                absolutePosition = function () {
                    d3.selectAll(".g-law").transition().duration(500).attr("transform", function (d, i) {
                        return "translate(" + -tscale(format.parse(d.beginning)) * z * width_ratio + 5 + "," + (i * (20 + lawh)) + "), scale("+width_ratio+",1)";
                    })
                    classicPosition();
                    d3.selectAll(".tick-lbl").text(function (d, j) { return (j + 1) + " mois"; })
                }

                timePosition = function () {
                    classicPosition();
                    d3.selectAll(".tick-lbl").text(function (d, j) { return tickform(d); });
                };

                quantiPosition = function () {
                    d3.selectAll('.steps').selectAll(".step")
                        .attr("x", function (d) {return d.qx; })
                        .attr("width", function (d) { return Math.max(0, d.qw); });
                    

                    d3.selectAll(".law-bg").transition().duration(500).style("opacity", 0);
                }

                function onclick(d) {

                    d3.selectAll(".g-law").style("opacity",0.2);
                    d3.select(".g-law."+ d.id).style("opacity",1);

                    d3.selectAll(".curr")
                        .classed("curr", false)
                        .style("fill", "#f3efed")
                        .style("opacity", 0.3);

                    d3.select("." + d.id)
                        .classed("curr", true)
                        .style("fill", "#fff")
                        .style("opacity", 0.6);

                    $("#text-title").text(d.short_title);
                    var themes=$('<p>');
                    d.themes.join(",").replace(/ et /g, ',').split(',').forEach(function(e,j){
                        themes.append("<a onclick=\"addBillsFilter('theme','"+e+"')\" class='badge' title='Filtrer les textes correspondant à ce thème' data-toggle='tooltip' data-placement='left'><span class='glyphicon glyphicon-tag'></span> "+e+"</a>&nbsp;&nbsp;");
                    }),
                        mots=(Math.round(d.total_mots / 1000. ) + "" ).replace(/\B(?=(\d{3})+(?!\d))/g, "&nbsp;").replace(/^0/, '');
                    $(".text-container").empty()
                        .append('<p><b>'+upperFirst(d.long_title)+"</b></p>")
                        .append('<p><span class="glyphicon glyphicon-calendar"></span>&nbsp;&nbsp;' + french_date(d.beginning) + " →  " + french_date(d.end) + "</p>");
                    if (d.procedure != "Normale") $(".text-container").append('<p>(' + d.procedure.toLowerCase() + ")</p>");
                    $(".text-container").append('<div class="gotomod"><a class="btn btn-info" href="articles.html?loi=' + d.id + '">Explorer les articles</a></div>');
                    var extrainfo = $('<div class="extrainfos">');
                    extrainfo.append('<p><span class="glyphicon glyphicon-folder-open" style="opacity: '+opacity_amdts(d.total_amendements)+'"></span>&nbsp;&nbsp;'+(d.total_amendements?d.total_amendements:'aucun')+" amendement"+(d.total_amendements>1?'s déposés':' déposé')+"</p>")
                        .append('<p><span class="glyphicon glyphicon-comment" style="opacity: '+opacity_mots(d.total_mots)+'"></span><span>&nbsp;&nbsp;plus de '+mots+" mille mots prononcés lors des débats parlementaires</span></p>")
                        .append(themes)
                        .append('<p><small>' +
                            '<a href="'+d.url_dossier_senat+'" target="_blank"><span class="glyphicon glyphicon-link"></span> dossier Sénat</a> &mdash; ' +
                            '<a href="'+d.url_dossier_assemblee+'" target="_blank"><span class="glyphicon glyphicon-link"></span> dossier Assemblée</a>' +
                            (d.url_jo ? '<br/><a href="'+d.url_jo+'" target="_blank"><span class="glyphicon glyphicon-link"></span> loi sur LégiFrance</a>' : '') +
                            '</small></p>');
                    $(".text-container").append(extrainfo);
                    $("a.badge").tooltip();
		    d3.selectAll(".laws .row").on('click', onunclick);
                }

		function onunclick(d) {
                    if ($(".text-container").html()) {
			$(".text-container").empty();
			$("#text-title").text("Sélectionner un texte");
			d3.selectAll(".curr")
                            .classed("curr", false)
                            .style("fill", "#f3efed")
                            .style("opacity", 0.3);
			d3.selectAll(".g-law").style("opacity", 1);
                    }
		}

                //Start drawing first sample
                prepareData();
                currFile = data.next_page;
                setTimeout((currFile ? dynamicLoad : drawGantt), 0);
                $("a.badge").tooltip();


                function drawStats() {

                    var height = 60,
                        barcontainer = d3.select("#bars"),
                        m = d3.max(d3.values(stats)),
                        bscale = d3.scale.linear().range([0, height]);
                    bscale.domain([0, m]);

                    d3.entries(stats).forEach(function (e, i) {
                        var label=(e.key == maxstat * binstat ? '2 ans et +' : e.key/binstat + " mois"),
                        step = barcontainer
                            .append("div")
                            .attr("class", "bar-step")
                            .attr("style", "width: " + 95/(maxstat+1) + "%; margin-right: " + 5/(maxstat+1) + "%");
                        if (active_filters['length'] && active_filters['length'] != e.key)
                            step.style("height", "100%")
                            .on('click', function() { rmBillsFilter('length'); });

                        step.append("div")
                            .attr("id", "mois_"+e.key)
                            .attr("class", (active_filters['length'] == e.key ? "filtered_month " : "") + "bar-value")
                            .attr("style", "height:" + bscale(e.value) + "px; width:100%; top:" + bscale(m - e.value) + "px")
                            .on('click', function(){
                                if (active_filters['length'] == e.key) rmBillsFilter('length');
                                else addBillsFilter('length', e.key);
                            }).popover(function(){
                                var popover_content = d3.select(document.createElement('div')).style("width", "100%").attr('class', 'pop0'),
                                    plural = (e.value > 1 ? 's' : '');
                                popover_content.append('p').html(active_filters['length'] == e.key ? 'Supprimer le filtre' : 'Cliquer pour filtrer sur ces textes');
                                return {
                                    title: e.value+' texte'+plural+' adopté'+plural+' en '+label,
                                    content: popover_content,
                                    placement: "mouse",
                                    displacement: [-113, -90],
                                    gravity: "top",
                                    mousemove: true};
                            });

                        step.append("div")
                            .attr("class", "bar-key")
                            .attr("style", "top:" + (bscale(m - e.value) + 5) + "px; font-size:" + d3.min([(parseInt(barcontainer.style("width")) / maxstat), 8]) + "px")
                            .text(label);
                    });
                }
            });
        }
        return vis;
    }
})()
