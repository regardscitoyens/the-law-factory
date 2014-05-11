var drawGantt,
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
        theme: "",
        year: 2013,
        length: ""
    },
    refreshBillsFilter = function(){
        for (var k in active_filters) {
            if (active_filters[k]) {
                $("ul.filters li."+k).html("<a onclick=\"rmBillsFilter('"+k+"')\" class='badge' title='Supprimer ce filtre'><span class='glyphicon glyphicon-remove-sign'></span> "+active_filters[k]+'</a>');
                if (k == "length") $(".bar-step #mois_"+active_filters[k].replace(' ', '')).addClass('filtered_month');
            } else $("ul.filters li."+k).empty();
        }
    },
    addBillsFilter = function(filtype, filval){
        if (filtype == "length") $(".bar-value.filtered_month").removeClass('filtered_month');
        active_filters[filtype]=filval;
        refreshBillsFilter();
        drawGantt('filter');
    },
    rmBillsFilter = function(filtype){ addBillsFilter(filtype,""); };

(function () {

    var thelawfactory = window.thelawfactory || (window.thelawfactory = {});

    thelawfactory.mod0 = function () {

        function vis(selection) {

            //Initialization
            var legendcontainer = d3.select("#legend").append("svg"),
                ganttcontainer = d3.select("#gantt").append("svg"),
                lawscont, grid,
                popover, currFile,
                lbls, steps, laws,
                gridrects, gridlines,
                allThemes = [], allYears = [],
                dossiers = [], smallset = [],
                mindate, maxdate,
                tscale, lblscale,
                ticks,
                basewidth = parseInt(d3.select("#gantt").style("width")) - 30,
                width = basewidth,
                lawh = 50,
                steph = lawh - 16,
                z = 1,
                layout = "t",
            sortByLeng = function(a,b) { return b.total_days - a.total_days },
            sortByAmds = function(a,b) { return b.total_amendements - a.total_amendements },
            sortByDate = function(a,b) { return Date.parse(b.end) - Date.parse(a.end) },
            sort_function = sortByDate,
            format = d3.time.format("%Y-%m-%d"),
            tickform = locale.timeFormat("%b %Y"),
            tickpresence=d3.scale.linear().range([3,1]).domain([1,7]).clamp(true),
            format_step = function(d){
                d = d.replace('depot', 'Dépôt')
                    .replace('1ère lecture', '1<sup>ère</sup> Lecture')
                    .replace('2ème lecture', '2<sup>ème</sup> Lecture')
                    .replace('nouv. lect.', 'Nouvelle Lecture')
                    .replace('l. définitive', 'Lecture Définitive')
                    .replace('CMP', 'Commission Mixte Paritaire')
                    .replace('hemicycle', 'Hémicycle');
                return d.charAt(0).toUpperCase() + d.substring(1);
            },
            format_instit = function(d){
                return d.replace('assemblee', 'Assemblée nationale')
                    .replace('senat', 'Sénat');
            },
            french_date = function(d){
                if (!d) return "";
                d = d.split('-');
                return [d[2], d[1], d[0]].join('/');
            },
            capitalize = function(d){
                if (!d) return "";
                return d.charAt(0).toUpperCase() + d.substring(1);
            },
            popover = function(d) {
                var ydisp = -45,
                    title = (d.institution=="assemblee" || d.institution=="senat" ? format_instit(d.institution) + " — " : "") + format_step(d.step ? d.step : d.stage),
                    div = d3.select(document.createElement("div")).style("width", "100%").attr('class', 'pop0');
                if (d.stage=="CMP") {
                    div.append("p").html(title);
                    title = format_step(d.stage);
                    ydisp -= 20;
                } else if (d.step) {
                    div.append("p").html(format_step(d.stage));
                    ydisp -= 20;
                }
                div.append("p").html('<span class="glyphicon glyphicon-calendar"></span><span> '+french_date(d.date) + (d.enddate && d.enddate != d.date ? " →  "+ french_date(d.enddate) : '')+'</span>');
                if ((d.institution=="assemblee" || d.institution=="senat") && d.nb_amendements) {
                    var legend_amd = '<svg width="13" height="18" style="vertical-align:middle;"><rect class="step" x="0" y="0" width="13" height="18" style="fill: '+(d.institution === "assemblee" ? "#ced6dd" : "#f99b90")+';"></rect><rect class="step-ptn" x="0" y="2" width="13" height="16" style="fill: url(mod0#diagonal'+(d.nb_amendements >= 200 ? '3' : (d.nb_amendements >= 50 ? '2' : '1'))+');"></rect></svg>';
                    div.append("p").style("vertical-align", "middle").html(legend_amd+"&nbsp;&nbsp;"+d.nb_amendements+" amendement"+(d.nb_amendements > 1 ? 's' : ''));
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

            function drawLabels() {
                d3.selectAll(".g-law").append("g").attr("class", "lbls")
                    .selectAll(".step-lbl").data(function (d) {
                        return d.steps
                    })
                    .enter()
                    .append("g")
                    .attr("class", "step-lbl")
                    .each(function(d,i){

                        var strg = "";
                        if(d.step!=="depot" && (d.institution==="assemblee" || d.institution==="senat")) {
                            strg = d.step.substr(0, 1).toUpperCase();
                        } else if(d.step==="depot") {
                            var dv = $(this).closest(".g-law").attr('class').split(/\s+/);
                            strg= dv[1].substr(0,3).toUpperCase();
                        } else if(d.institution==="CMP") {
                            strg = "CMP";
                        } else if(d.institution==="conseil constitutionnel"){
                            strg="CC";
                        } else if (d.stage==="promulgation") {
                            strg="JO";
                        }

                        for(var j = 0; j<strg.length; j++) {
                            d3.select(this).append("text")
                                .attr("x", function (e) {return (layout === "q" ? e.qx+2 : lblscale(scaled_date_val(e)));})
                                .attr("y", 38+j*9)
                                .attr("dx", 5)
                                .text(strg[j])
                                .popover(popover);
                        }
                    })
            }

            zooming = function(lvl) {
                var sft = $("#gantt").scrollLeft(),
                    perc = ($("#gantt").width() / 2 + sft) / (width * z);
                if(layout==="q") return;
                if(d3.event && d3.event.scale) z = d3.event.scale;
                else if(lvl) z=lvl;
                else z=1;
                $("#mod0-slider").slider("value", z);

                d3.selectAll(".steps").attr("transform", "scale(" + z + ",1)");
                d3.selectAll(".law-bg").attr("transform", "scale(" + z + ",1)");
                d3.selectAll(".row").attr("transform", "scale(" + z + ",1)");
                d3.selectAll(".tl-bg").attr("transform", "scale(" + z + ",1)");

                if(layout==="a")
                    d3.selectAll(".g-law").attr("transform", function(d,i){return  "translate(" + (-tscale(format.parse(d.beginning))*z+5) + ","+ (i * (20 + lawh)) +")"});

                d3.selectAll(".tick-lbl").attr("x", function (d) {
                    return tscale(d) * z;
                })
                .style("opacity",function(d,i){
                    return (i % Math.round(tickpresence(z))==0 && tscale(d)*z < width*z - 50 ? 1 : 0);
                });

                legendcontainer.attr("width", width * z);
                ganttcontainer.attr("width", width * z);

                d3.selectAll(".tick").attr("x1",function(d){return tscale(d)*z}).attr("x2",function(d){return tscale(d)*z})

                if (z < 10 && layout != "q") d3.selectAll(".lbls").attr('opacity', 0);
                else d3.selectAll(".lbls").attr("opacity", 1);

                $("#gantt").scrollLeft(perc * width * z - sft - $("#gantt").width() / 2 );
            };

            function initGanttSVG() {
                $("#mod0-slider").slider("value", 1);
                $("#legend svg").empty();
                $("#gantt svg").empty();
                var defs = ganttcontainer
                    .insert('defs', ':first-child');
                defs.append('pattern')
                    .attr('id', 'diagonal1')
                    .attr('patternUnits', 'userSpaceOnUse')
                    .attr("x", 0).attr("y", 0)
                    .attr('width', 10)
                    .attr('height', 16)
                    .append('path')
                    .attr('d', 'M0,11L10,11')
                    .style('stroke', '#fff')
                    .style('stroke-width', 2)
                    .style("opacity", 0.7);
                defs.append('pattern')
                    .attr('id', 'diagonal2')
                    .attr('patternUnits', 'userSpaceOnUse')
                    .attr("x", 0).attr("y", 0)
                    .attr('width', 10)
                    .attr('height', 16)
                    .append('path')
                    .attr('d', 'M0,11L10,11M0,8L10,8')
                    .style('stroke', '#fff')
                    .style('stroke-width', 2)
                    .style("opacity", 0.7);
                defs.append('pattern')
                    .attr('id', 'diagonal3')
                    .attr('patternUnits', 'userSpaceOnUse')
                    .attr("x", 0).attr("y", 0)
                    .attr('width', 10)
                    .attr('height', 16)
                    .append('path')
                    .attr('d', 'M0,11L10,11M0,8L10,8M0,5L10,5')
                    .style('stroke', '#fff')
                    .style('stroke-width', 2)
                    .style("opacity", 0.7);
                lawscont = ganttcontainer.append("g").attr("class", "laws");
                grid = ganttcontainer.insert('g', ':first-child').attr("class", "grid");
            }

            selection.each(function (data) {

                drawGantt = function(action) {
                    var zoo = $("#mod0-slider").attr('value'),
                        scroll = {scrollTop: "0px", scrollLeft: "0px"};
                    refreshBillsFilter();
                    initGanttSVG();
                    $("#legend").show(400);
                    if (action == 'time') {
                        layout = "t";
                        zoo = 10;
                        action = 'sortd';
                        scroll['scrollLeft'] = "100000px";
                        $("#display_menu .chosen").removeClass('chosen');
                        $("#display_menu #dm-time").addClass('chosen');
                        $(".ctrl-sort").hide(400);
                        $(".ctrl-zoom").show(400);
                    } else if (action == 'absolute') {
                        layout = "a";
                        zoo = 1;
                        action = 'sorta';
                        $("#display_menu .chosen").removeClass('chosen');
                        $("#display_menu #dm-absolute").addClass('chosen');
                        $(".ctrl-sort").show(400);
                        $(".ctrl-zoom").show(400);
                    } else if (action == 'quanti') {
                        layout = "q";
                        zoo = 1;
                        action = 'sortl';
                        $("#display_menu .chosen").removeClass('chosen');
                        $("#display_menu #dm-quanti").addClass('chosen');
                        $(".ctrl-sort").show(400);
                        $(".ctrl-zoom").hide(400);
                        $("#legend").hide(400);
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
                    zooming(zoo);
                    if (layout == "t") timePosition();
                    if (layout == "a") absolutePosition();
                    if (layout == "q") quantiPosition();
                    drawLabels();
                    //Define scroll behaviour
                    d3.select("#gantt").on("scroll", function (e) {
                        d3.select(".timeline").attr("transform", "translate(-" + $(this).scrollLeft() + ", 0)");
                        d3.selectAll(".law-name").attr("transform", "translate(" + $(this).scrollLeft() + ", 0)");
                    })
                    if (scroll) $("#gantt").animate(scroll);
                }

                function prepareData() {
                    data.dossiers.forEach(function (d, i) {
                        var st;

                        d.steps.forEach(function (e, j) {

                            //if (j == 0 && (e.date === "" || e.date < d.beginning)) e.date = d.beginning
                            if (e.date && e.date != "" && e.enddate < e.date) e.enddate = e.date
                            if (!e.date || e.date === "") e.date = e.enddate;

                            if (j>0 && d.steps[j-1].enddate == e.date) {
                                if (d.steps[j-1].overlap) e.overlap=d.steps[j-1].overlap+1;
                                else e.overlap=1
                            } else if (j>0 && d.steps[j-1].overlap) {

                                var pastdate=format.parse(d.steps[j-1].enddate),
                                    dd = pastdate.getDate()+d.steps[j-1].overlap,
                                    mm = pastdate.getMonth()+1,
                                    y = pastdate.getFullYear();
                                if (mm<10) mm="0"+mm;
                                if (dd<10) dd="0"+dd;

                                // Monitor Overlaps
                                if (y+"-"+mm+"-"+dd>=e.date) {
                                    console.log("OVERLAP:",e.date,y+"-"+mm+"-"+dd)
                                    e.overlap = d.steps[j - 1].overlap + 1;
                                }
                            }

                            e.qw = getQwidth(e);
                            if (j == 0) e.qx = 5;
                            else e.qx = d.steps[j - 1].qx + d.steps[j - 1].qw + 3;
                        })
                    })
                    dossiers = dossiers.concat(data.dossiers)
                }

            // function used for multiple data files - progressive loading
                function dynamicLoad() {
                    d3.json('http://www.lafabriquedelaloi.fr/api/' + currFile, function (error, json) {
                        data = json;
                        prepareData();
                        currFile = json.next_page;
                        setTimeout((currFile ? dynamicLoad : computeFilters), 0);
                    })
                }

            // Populate years and themes in filter menu
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
                    smallset = dossiers
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
                            return active_filters['length'].replace(/\D/g,'') == Math.round((format.parse(d.end) - format.parse(d.beginning)) / 2628000000.);
                        })
                        .sort(sort_function);

                    // find date range
                    mindate = ""; maxdate = "";
                    smallset.forEach(function(d){
                        mindate = (mindate && mindate < d.beginning ? mindate : d.beginning);
                        maxdate = (maxdate && maxdate > d.end ? maxdate : d.end);
                    });
                    mindate = format.parse(mindate < data.min_date ? data.min_date : mindate);
                    maxdate = format.parse(maxdate > data.max_date ? data.max_date : maxdate);

                    //update svg size
                    if (maxdate - mindate > 126144000000) width = 2 * basewidth;
                    else width = basewidth;
                    ganttcontainer.attr("height", Math.max(2, smallset.length) * (20 + lawh)).attr("width", width);
                    legendcontainer.attr("width", width);

                    ticks = d3.time.months(mindate, maxdate, 1);
                    tscale = d3.time.scale().range([0, width]);
                    tscale.domain([mindate, maxdate]);
                    lblscale = d3.time.scale().range([0, width * 10]);
                    lblscale.domain([mindate, maxdate]);

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
                        .attr("width", function (d) { return tscale(format.parse(d.end)) - tscale(format.parse(d.beginning)); })
                        .attr("class", "law-bg")
                        .attr("height", steph)
                        .attr("opacity", 0.3).style("fill", "#d8d1c9");

                    //addsingle law steps
                    steps = laws.append("g")
                        .attr("class", "steps")
                        .selectAll("step").data(function (d) { return d.steps; })
                        .enter()
                        .append("g")
                        .attr("class", "g-step")
                        .popover(popover);

                    steps.append("rect")
                        .attr("class", "step")
                        .attr("x", function (e) { return tscale(scaled_date_val(e)); })
                        .attr("y", 28)
                        .attr("width", getQLwidth)
                        .attr("height", steph)
                        .style("fill", color_step);

                    //fill pattern
                    steps.append("rect")
                        .filter(function (e) { return e.stage !== "promulgation" && e.nb_amendements > 0; })
                        .attr("class", "step-ptn")
                        .attr("x", function (e) { return tscale(scaled_date_val(e)); })
                        .attr("y", 48)
                        .attr("width", getQLwidth)
                        .attr("height", steph - 20)
                        .style("fill", function (d) {
                            if (d.nb_amendements >= 200) return"url(mod0#diagonal3)"
                            else if (d.nb_amendements >= 50) return"url(mod0#diagonal2)"
                            else if (d.nb_amendements >= 0) return"url(mod0#diagonal1)"
                        })

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
                }

                function getQwidth(e) {
                    if (e.stage === "promulgation") return 10;
                    var diff = format.parse(e.enddate) - format.parse(e.date);
                    return Math.max(15, Math.floor(diff / 86400000));
                }

                function getQLwidth(e) {
                    if (e.stage === "promulgation") return 3;
                    if (e.date === "") e.date = e.enddate;
                    var val = tscale(format.parse(e.enddate)) - tscale(format.parse(e.date));
                    return (val >= 3 ? val - 2 : 1);
                }

                function color_step(d) {
                    if (d.institution === "assemblee") return "#ced6dd";
                    else if (d.institution === "senat") return "#f99b90";
                    else if (d.institution === "conseil constitutionnel") return "rgb(231, 221, 158)";
                    else if (d.stage === "promulgation") return "#716259";
                    else return "#aea198";
                };

                classicPosition = function() {
                    d3.selectAll(".step")
                        .attr("x", function (e) { return tscale(scaled_date_val(e)); })
                        .attr("width", getQLwidth);

                    d3.selectAll(".step-lbl")
                        .attr("x", function (e, i) { return lblscale(format.parse(e.date)); });

                    d3.selectAll(".step-ptn")
                        .transition().duration(500)
                        .attr("x", function (e, i) { return tscale(scaled_date_val(e)); })
                        .attr("width", getQLwidth);
                }

                absolutePosition = function () {
                    d3.selectAll(".g-law").transition().duration(500).attr("transform", function (d, i) {
                        return "translate(" + (-tscale(format.parse(d.beginning))*z + 5) + "," + (i * (20 + lawh)) + ")"
                    })
                    classicPosition();
                    d3.selectAll(".tick-lbl").text(function (d, j) { return (j + 1) + " mois"; })
                }

                timePosition = function () {
                    d3.selectAll(".g-law").transition().duration(500).attr("transform", function (d, i) {
                        return "translate(0," + (i * (20 + lawh)) + ")"
                    });
                    classicPosition();
                    d3.selectAll(".tick-lbl").text(function (d, j) { return tickform(d); });
                };

                quantiPosition = function () {
                    d3.selectAll(".g-law").transition().duration(500).attr("transform", function (d, i) {
                        return "translate(0," + ( i * (20 + lawh)) + ")"
                    });

                    d3.selectAll(".step")
                        .attr("x", function (d) {return d.qx; })
                        .attr("width", function (d) { return (d.stage === "promulgation" ? 15 : d.qw); })
                        .style("fill", color_step);

                    d3.selectAll(".step-ptn")
                        .attr("x", function (d) {return d.qx; })
                        .attr("width", function (d) { return (d.stage === "promulgation" ? 15 : d.qw); });

                    d3.selectAll(".law-bg").transition().duration(500).style("opacity", 0);
                }

                function onclick(d) {
                    d3.selectAll(".curr")
                        .classed("curr", false)
                        .style("fill", "#f3efed")
                        .style("opacity", 0.3);

                    d3.select("." + d.id)
                        .classed("curr", true)
                        .style("fill", "#fff")
                        .style("opacity", 0.6);

                    $("#text-title").text(d.short_title);
                    var themes=$('<p class="themes">');
                    d.themes.join(",").replace(/ et /g, ',').split(',').forEach(function(e,j){
                        themes.append("<a onclick=\"addBillsFilter('theme','"+e+"')\" class='glyphicon glyphicon-tag badge' title='Filtrer les lois correspondant à ce thème'> "+e+"</a>&nbsp;&nbsp;");
                    }),
                        mots=1000*(Math.round(d.total_mots / 1000.));
                    $(".text-container").empty()
                        .append("<p><b>"+capitalize(d.long_title)+"</b></p>")
                        .append('<p><span class="glyphicon glyphicon-calendar"></span>&nbsp;&nbsp;' + french_date(d.beginning) + " →  " + french_date(d.end) + "</p>")
                        .append("<p>(" + d.procedure.toLowerCase().replace('normale', 'procédure normale') + ")</p>")
                        .append("<p><small>"+themes.html()+"</small></p>")
                        .append('<p><span class="glyphicon glyphicon-folder-open" style="opacity: '+opacity_amdts(d.total_amendements)+'"></span>&nbsp;&nbsp;'+(d.total_amendements?d.total_amendements:'aucun')+" amendement"+(d.total_amendements>1?'s déposés':' déposé')+" sur ce texte</p>")
                        .append('<p><span class="glyphicon glyphicon-comment" style="opacity: '+opacity_mots(d.total_mots)+'"></span>&nbsp;&nbsp;plus de '+(mots?mots:'1')+" mille mots prononcés<br>lors des débats parlementaires</p>")
                        .append("<p><small>(sources : <a href='" + d.url_dossier_assemblee + "'>dossier Assemblée</a> &mdash; <a href='" + d.url_dossier_senat + "'>dossier Sénat</a>)</small></p>")
                        .append('<div class="gotomod"><a class="btn btn-info" href="mod1?l=' + d.id + '">Explorer les articles</a></div>');

                }

                //Start drawing first sample
                currFile = data.next_page;
                prepareData();
                drawGantt('time');
                setTimeout((currFile ? dynamicLoad : computeFilters),0);

            });
        };

        return vis;
    };

    thelawfactory.mod0_bars = function () {

        function vis(selection) {

            var barcontainer = d3.select("#bars")
            var barwidth = parseInt(barcontainer.style("width"))
            var bscale = d3.scale.linear().range([0, 60]);

            selection.each(function (json) {

                var threshold = 720;
                var count = 0;

                for (k in json) {
                    if (parseInt(k) >= threshold) {
                        count += json[k]
                        delete json[k]
                    }
                }

                threshold = threshold.toString()

                json[threshold] = count;

                var keys = d3.keys(json)
                var vals = d3.values(json)
                var l = vals.length;
                var m = d3.max(vals)
                bscale.domain([0, m])

                var w = barwidth / l

                d3.entries(json).forEach(function (e, i) {
                    var label=(e.key/30) +(e.key === threshold ? "+" : "") + " mois",
                        step = barcontainer
                        .append("div")
                        .attr("class", "bar-step")
                        .attr("style", "width:" + (w * 93 / 100) + "px; margin-right:" + (w * 5 / 100) + "px");

                    step.append("div")
                        .attr("id", "mois_"+label.replace(' ', ''))
                        .attr("class", "bar-value")
                        .attr("style", "height:" + bscale(e.value) + "px; width:100%; top:" + bscale(m - e.value) + "px")
                        .on('click', function(d){ addBillsFilter('length',label) })
                        .popover(function(d,i){
                            var popover_content = d3.select(document.createElement('div')).style("width", "100%").attr('class', 'pop0');
                            popover_content.append('p').html('Cliquer pour filtrer sur ces textes');
                            return {title: e.value+' textes adoptés en ' + label.replace('+mois', ' 2 ans et plus'), content: popover_content, placement: "mouse", displacement: [-113, -90], gravity: "top", mousemove: true};
                        });

                    step.append("div")
                        .attr("class", "bar-key")
                        .attr("style", "top:" + (bscale(m - e.value) + 5) + "px; font-size:" + d3.min([(w * 4 / 10), 10]) + "px")
                        .text(label);
                })

                function groupStats(i, data) {
                    data = d3.entries(data)
                    newData = {}
                    for (var j = 0; j < data.length; j += i) {
                        var key = (j + 1) * 30 + (i - 1) * 30
                        if (j < data.length - 2) newData[key] = data[j].value + data[j + 1].value + data[j + 2].value
                        else if (j < data.length - 1) newData[key] = data[j].value + data[j + 1].value
                        else newData[key] = data[j].value;

                    }
                    return newData;
                }
            })
        }
        return vis;
    };
})()
