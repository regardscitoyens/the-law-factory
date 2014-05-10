(function () {

    var thelawfactory = window.thelawfactory || (window.thelawfactory = {});

    thelawfactory.mod0 = function () {

        function vis(selection) {

            //Initialization
            var ganttcontainer = d3.select("#gantt").append("svg"),
                currFile,
                layout = "t",
                lbls,
                steps,
                laws,
                gridrects,
                gridlines,
                dossiers = [],
                format = d3.time.format("%Y-%m-%d"),
                tickform = d3.time.format("%b %Y"),
                width = parseInt(d3.select("#gantt").style("width")) * 2 - 15,
                tscale = d3.time.scale().range([0, width]),
                lblscale = d3.time.scale().range([0, width * 10]),
                tickpresence=d3.scale.linear().range([3,1]).domain([1,7]).clamp(true),
                qscale = d3.time.scale().range([10, width]),
                minstr = "2010-01-05",
                mindate = format.parse(minstr),
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
                today = new Date(),
                lawh = 50,
                z = 1,
                steph = lawh - 16;
            ticks = d3.time.months(mindate, today, 1);


            tscale.domain([mindate, today]);
            lblscale.domain([mindate, today]);
            qscale.domain([0, today]);
            ganttcontainer.attr("width", width).attr("height", 2900);


            //var zoom = d3.behavior.zoom()
            //    .scaleExtent([1, 10])
            //    .on('zoom', zooming);


            //ganttcontainer.call(zoom);

            var lawscont = ganttcontainer.append("g").attr("class", "laws")
            var grid = ganttcontainer.insert('g', ':first-child').attr("class", "grid");
            writeDefs();

            function drawLabels() {
                d3.selectAll(".g-law").append("g").attr("class", "lbls")
                    .selectAll(".step-lbl").data(function (d) {
                        return d.steps
                    })
                    .enter()
                    .append("g")
                    //.append("text")
                    .attr("class", "step-lbl")
                    .each(function(d,i){

                        var strg;

                        if(d.step!=="depot" && (d.institution==="assemblee" || d.institution==="senat")) {
                            strg = d.step.substr(0, 1).toUpperCase();
                        }
                        else if(d.step==="depot") {

                            var dv = $(this).closest(".g-law").attr('class').split(/\s+/);
                            strg= dv[1].substr(0,3).toUpperCase();
                        }
                        else if(d.institution==="CMP") {
                            strg = "CMP";
                        }
                        else if(d.institution==="conseil constitutionnel"){
                            strg="CC";
                        }
                        else if (d.stage==="promulgation") {
                            strg="JO";
                        }
                        else strg="";

                        for(var j = 0; j<strg.length; j++) {

                            d3.select(this).append("text")
                                .attr("x", function (e, i) {

                                    if (layout === "q") {
                                        return e.qx+2;
                                    }
                                    else {

                                    var val;

                                    if (e.overlap) {
                                        var mydate = format.parse(e.date);
                                        var dd = mydate.getDate() + e.overlap;
                                        var mm = mydate.getMonth() + 1;
                                        var y = mydate.getFullYear();

                                        val = lblscale(format.parse(y + "-" + mm + "-" + dd));
                                    }
                                    else val = lblscale(format.parse(e.date));
                                    return val;
                                }
                                })
                                .attr("y", 38+j*9)
                                .attr("dx", 5)
                                .text(strg[j])
                        }
                    })
            }

            zooming = function(lvl) {
               lastz = z;
                var perc=($("#gantt").scrollLeft()+$("#gantt").width()/2)/(width*z);
                if(layout==="q") return;
                if(d3.event && d3.event.scale) z = d3.event.scale;
                else if(lvl) z=lvl;
                else z=1;

                d3.selectAll(".steps").attr("transform", "scale(" + z + ",1)");
                d3.selectAll(".law-bg").attr("transform", "scale(" + z + ",1)");
                d3.selectAll(".row").attr("transform", "scale(" + z + ",1)");

                if(layout==="a") {
                    d3.selectAll(".g-law").attr("transform", function(d,i){return  "translate(" + (-d.xoffset*z+5) + ","+ (30 + i * (20 + lawh)) +")"});
                    //d3.selectAll(".law-bg").attr("transform", function(d,i){return  "translate(" + (-d.xoffset*z+5) + ","+ (30 + i * (20 + lawh)) +")"});
                }


                d3.select(".tl-bg").attr("width", width * z);
                d3.selectAll(".tick-lbl").attr("x", function (d) {
                    return tscale(d) * z;
                })
                .style("opacity",function(d,i){
                    if (i % Math.round(tickpresence(z))==0) return 1;
                    else return 0;
                });

                ganttcontainer.attr("width", width * z);

                if (z < 10) d3.selectAll(".lbls").remove();
                else  {
                    drawLabels();
                }

                d3.selectAll(".tick").attr("x1",function(d){return tscale(d)*z}).attr("x2",function(d){return tscale(d)*z})

                $("#gantt").scrollLeft(perc*width*z- $("#gantt").width()/2);
            };


            function writeDefs() {
                var defs = ganttcontainer
                    .insert('defs', ':first-child')

                defs.append('pattern')
                    .attr('id', 'diagonal1')
                    .attr('patternUnits', 'userSpaceOnUse')
                    .attr("x", 0).attr("y", 0)
                    .attr('width', 10)
                    .attr('height', 16)
                    .append('path')
                    .attr('d', 'M0,11L10,11')
                    //.style("fill","#fff")
                    .style('stroke', '#fff')
                    .style('stroke-width', 2)
                    .style("opacity", 0.7)

                defs.append('pattern')
                    .attr('id', 'diagonal2')
                    .attr('patternUnits', 'userSpaceOnUse')
                    .attr("x", 0).attr("y", 0)
                    .attr('width', 10)
                    .attr('height', 16)
                    .append('path')
                    .attr('d', 'M0,11L10,11M0,8L10,8')
                    //.style("fill","#fff")
                    .style('stroke', '#fff')
                    .style('stroke-width', 2)
                    .style("opacity", 0.7)

                defs.append('pattern')
                    .attr('id', 'diagonal3')
                    .attr('patternUnits', 'userSpaceOnUse')
                    .attr("x", 0).attr("y", 0)
                    .attr('width', 10)
                    .attr('height', 16)
                    .append('path')
                    .attr('d', 'M0,11L10,11M0,8L10,8M0,5L10,5')
                    //.style("fill","#fff")
                    .style('stroke', '#fff')
                    .style('stroke-width', 2)
                    .style("opacity", 0.7)

            }



            selection.each(function (data) {

                currFile = data.next_page;
                //Start drawing
                prepareData();
                dynamicLoad();


                //Define scroll beahviour
                d3.select("#gantt").on("scroll", function (e) {
                    var v = 0;
                    if (layout === "q") v = -30
                    d3.select(".timeline").attr("transform", "translate(0," + $(this).scrollTop() + ")");
                    d3.selectAll(".law-name").attr("transform", "translate(" + $(this).scrollLeft() + "," + v + ")")
                })

                function prepareData() {
                    data.dossiers.forEach(function (d, i) {
                        var st;

                        d.xoffset = tscale(format.parse(d.beginning));

                        d.steps.forEach(function (e, j) {

                            //if (j == 0 && (e.date === "" || e.date < d.beginning)) e.date = d.beginning
                            if (e.date && e.date != "" && e.enddate < e.date) e.enddate = e.date
                            if (!e.date || e.date === "") e.date = e.enddate;

                            if(j>0 && d.steps[j-1].enddate == e.date) {
                                if(d.steps[j-1].overlap) e.overlap=d.steps[j-1].overlap+1;
                                else e.overlap=1
                            }

                            else if(j>0 && d.steps[j-1].overlap) {

                                var pastdate=format.parse(d.steps[j-1].enddate);

                                var dd = pastdate.getDate()+d.steps[j-1].overlap;
                                if (dd<10) dd="0"+dd;

                                var mm = pastdate.getMonth()+1;
                                if (mm<10) mm="0"+mm;

                                var y = pastdate.getFullYear();


                                if(y+"-"+mm+"-"+dd>=e.date) {
                                    console.log(e.date,y+"-"+mm+"-"+dd)
                                    e.overlap = d.steps[j - 1].overlap + 1;

                                }
                            }

                            e.qw = getQwidth(e);

                            if (j == 0) e.qx = 5;
                            else {
                                e.qx = d.steps[j - 1].qx + d.steps[j - 1].qw + 3;
                            }
                        })
                    })
                    dossiers = dossiers.concat(data.dossiers)

                    //draws current selection
                    addLaws();
                }

                //function used for multiple data files - progressive loading
                function dynamicLoad() {

                    d3.json('http://www.lafabriquedelaloi.fr/api/' + currFile, function (error, json) {

                        data = json;
                        prepareData();

                        if (json.next_page) {
                            currFile = json.next_page;
                            dynamicLoad();
                        } else {
                            drawAxis();
                            timePosition();
                        }
                    })
                }


                function drawAxis() {


                    var tl = ganttcontainer.append("g")
                        .attr("class", "timeline")

                    tl.append("rect")
                        .attr("x", 0)
                        .attr("y", 0)
                        .attr("width", width)
                        .attr("class", "tl-bg")
                        .attr("height", 30)
                        .style("fill", "white")
                        .style("stroke", "none")

                    var tk = tl.selectAll(".tick-lbl")
                        .data(ticks).enter();

                    tk.append("text")
                        .attr("class", "tick-lbl")
                        .attr("y", 20)
                        .attr("x", function (d) {
                            return tscale(d) * z;
                        })
                        .text(function (d) {
                            return tickform(d)
                        })
                        .attr("text-anchor", "middle")
                        .style("opacity",function(d,i){
                            if (i % tickpresence(z)==0) return 1;
                            else return 0;
                        })
                }

                function addLaws() {

                    //add containing rows
                    gridrects = lawscont.selectAll(".row")
                        .data(dossiers).enter()
                        .append("rect")
                        .attr("class", function (d) {
                            return "row " + d.id
                        })
                        .attr("x", 0)
                        .attr("y", function (d, i) {
                            return 32 + i * (20 + lawh)
                        })
                        .attr("opacity", 0.3)
                        .attr("width", width)
                        .attr("height", 20 + lawh - 4)
                        .style("fill", "#f3efed")


                    //add single law group

                    laws = lawscont.selectAll(".g-law")
                        .data(dossiers).enter()
                        .append("g")
                        .attr("class", function (d) {
                            return "g-law " + d.id
                        })
                        .attr("transform", function (d, i) {
                            return "translate(0," + (30 + i * (20 + lawh)) + ")"
                        })
                        .on("click", onclick);


                    //single law background rectangle
                    laws.append("rect")
                        .attr("x", function (d) {
                            return tscale(format.parse(d.beginning))
                        })
                        .attr("y", 28)
                        .attr("width", function (d) {
                            return tscale(format.parse(d.end)) - tscale(format.parse(d.beginning))
                        })
                        .attr("class", "law-bg")
                        .attr("height", steph)
                        .attr("opacity", 0.3).style("fill", "#d8d1c9");


                    //addsingle law steps
                    steps = laws.append("g")
                        .attr("class", "steps")
                        .selectAll("step").data(function (d) {
                            return d.steps
                        })
                        .enter()
                        .append("g")
                        .attr("class", "g-step")
                        .popover(function (d, i) {
                            var title = (d.institution=="assemblee" || d.institution=="senat" ? format_instit(d.institution) + " — " : "") + format_step(d.step ? d.step : d.stage),
                                div = d3.select(document.createElement("div")).style("width", "100%").attr('class', 'pop0');
                            if (d.step) div.append("p").html(format_step(d.stage));
                            div.append("p").html('<span class="glyphicon glyphicon-calendar"></span><span> '+french_date(d.date) + (d.enddate && d.enddate != d.date ? " →  "+ french_date(d.enddate) : '')+'</span>');
                            if ((d.institution=="assemblee" || d.institution=="senat") && d.nb_amendements) {
                                var legend_amd = '<svg width="13" height="18" style="vertical-align:middle;"><rect class="step" x="0" y="0" width="13" height="18" style="fill: '+(d.institution === "assemblee" ? "#ced6dd" : "#f99b90")+';"></rect><rect class="step-ptn" x="0" y="2" width="13" height="16" style="fill: url(mod0#diagonal'+(d.nb_amendements >= 200 ? '3' : (d.nb_amendements >= 50 ? '2' : '1'))+');"></rect></svg>';
                                div.append("p").style("vertical-align", "middle").html(legend_amd+"&nbsp;&nbsp;"+d.nb_amendements+" amendement"+(d.nb_amendements > 1 ? 's' : ''));
                            }
                            return {
                                title: title,
                                content: div,
                                placement: "mouse",
                                gravity: "right",
                                displacement: [10, -125],
                                mousemove: true
                            };
                        });

                    steps.append("rect")
                        .attr("class", "step")
                        .attr("x", function (e, i) {
                            var val;

                            if(e.overlap) {
                                var mydate=format.parse(e.date);
                                var dd = mydate.getDate()+ e.overlap;
                                var mm = mydate.getMonth()+1;
                                var y = mydate.getFullYear();

                                val = tscale(format.parse(y+"-"+mm+"-"+dd));
                            }
                            else val= tscale(format.parse(e.date));
                            return val;
                        })
                        .attr("y", 28)
                        .attr("width", function (e) {
                            if (e.stage === "promulgation")
                                return 3;
                            else {
                                if (e.date === "")
                                    e.date = e.enddate
                                //if e.date<
                                var val = tscale(format.parse(e.enddate)) - tscale(format.parse(e.date))
                                if (val >= 3)
                                    return val - 2;
                                else
                                    return 1
                            }
                        })
                        .attr("height", steph)
                        .style("fill", function (d) {
                            if (d.institution === "assemblee") return "#ced6dd"
                            else if (d.institution === "senat") return "#f99b90"
                            else if (d.institution === "conseil constitutionnel") return "rgb(231, 221, 158)"
                            else if (d.stage === "promulgation") return "#716259"
                            else return "#aea198"
                        })
                        .on("click", function (e) {
                            console.log(e);
                        })


                    //fill pattern
                    steps.append("rect")
                        .filter(function (e) {
                            return e.stage !== "promulgation" && e.nb_amendements > 0
                        })
                        .attr("class", "step-ptn")
                        .attr("x", function (e, i) {
                            var val;

                            if(e.overlap) {
                                var mydate=format.parse(e.date);
                                var dd = mydate.getDate()+ e.overlap;
                                var mm = mydate.getMonth()+1;
                                var y = mydate.getFullYear();

                                val = tscale(format.parse(y+"-"+mm+"-"+dd));
                            }
                            else val= tscale(format.parse(e.date));
                            return val;
                        })
                        .attr("y", 48)
                        .attr("width", function (e) {
                            if (e.stage === "promulgation") return 3;
                            else {
                                if (e.date === "") e.date = e.enddate
                                var val = tscale(format.parse(e.enddate)) - tscale(format.parse(e.date))
                                if (val >= 3) return val - 2;
                                else return 1
                            }
                        })
                        .attr("height", steph - 20)
                        .style("fill", function (d) {
                            if (d.nb_amendements >= 200) return"url(mod0#diagonal3)"
                            else if (d.nb_amendements >= 50) return"url(mod0#diagonal2)"
                            else if (d.nb_amendements >= 0) return"url(mod0#diagonal1)"
                        })


                    //add labels
                    ganttcontainer.selectAll(".law-name")
                        .data(dossiers).enter()
                        .append("text")
                        .attr("x", parseInt(d3.select("#gantt").style("width")) * 0.5)
                        .attr("y", function (d, i) {
                            return i * (20 + lawh) + 46
                        })
                        .attr("class", "law-name").text(function (e) {
                            return e.short_title
                        })
                        .style("fill", "#333")
                        .attr("font-size", "0.85em")
                        .attr("text-anchor", "middle")
                        .on("click", function (d) {
                            if (layout === "t") {
                                var posx = tscale(format.parse(d.beginning)) * z - 15;
                                //console.log(posx,d.id,".g-law."+d.id)
                                $("#gantt").animate({ scrollLeft: posx + "px" });
                            }
                            else $("#gantt").animate({ scrollLeft: 0 + "px" });
                            onclick(d);
                        });


                    //update svg height
                    ganttcontainer.attr("height", dossiers.length * (20 + lawh)+30)


                    //recompute vertical grid to match new height
                    d3.selectAll(".tick").remove();

                    gridlines = grid.selectAll(".tick")
                        .data(ticks).enter();

                    gridlines.append("line")
                    .attr("class", "tick")
                        .attr("x1", function(e){return tscale(e)})
                        .attr("y1", 0)
                        .attr("x2", function(e){return tscale(e)})
                        .attr("y2", dossiers.length * (20 + lawh))
                        .attr("stroke", "#ddd")
                        .attr("stroke-width", 1)
                        .attr("opacity", 0.6);
                }

                function getQwidth(e) {
                    //console.log(e)
                    if (e.stage === "promulgation")
                        return 10;
                    else {
                        var diff = format.parse(e.enddate) - format.parse(e.date)
                        var day = 1000 * 60 * 60 * 24;
                        //console.log(e.enddate, e.date, diff/day)
                        var val = Math.floor(diff / day)
                        if (val > 15) return val
                        else return 15
                    }
                }


                absolutePosition = function () {

                    //sortByLength();
                    zooming(1);
                    $("#mod0-slider").slider( "value", 1 );
                    $(".ctrl-sort").show(400);
                    layout = "a";
                    $(".ctrl-zoom").show(400);
                    d3.selectAll(".g-law").transition().duration(500).attr("transform", function (d, i) {
                        return "translate(" + (-d.xoffset*z + 5) + "," + (30 + i * (20 + lawh)) + ")"
                    })
                    d3.selectAll(".row").transition().duration(500).attr("transform", "translate(0,0) scale("+z+",1)")
                    d3.selectAll(".law-name").transition().duration(500).attr("transform", "translate(0,0)")


                    d3.selectAll(".step")
                        .attr("x", function (e, i) {
                            var val;

                            if(e.overlap) {
                                var mydate=format.parse(e.date);
                                var dd = mydate.getDate()+ e.overlap;
                                var mm = mydate.getMonth()+1;
                                var y = mydate.getFullYear();

                                val = tscale(format.parse(y+"-"+mm+"-"+dd));
                            }
                            else val= tscale(format.parse(e.date));
                            return val;
                        })
                    .attr("width", function (e) {
                        if (e.stage === "promulgation")
                            return 3;
                        else {
                            if (e.date === "")
                                e.date = e.enddate
                            //if e.date<
                            var val = tscale(format.parse(e.enddate)) - tscale(format.parse(e.date))
                            if (val >= 3)
                                return val - 2;
                            else
                                return 1
                        }
                    });

                    d3.selectAll(".step-lbl")
                        .attr("x", function (e, i) {
                            var val = lblscale(format.parse(e.date));
                            return val
                        })

                    d3.selectAll(".step-ptn")
                        .transition().duration(500)
                        .attr("x", function (e, i) {
                            var val = tscale(format.parse(e.date));
                            if (e.overlap) val+= e.overlap;
                            return val
                        })
                        .attr("width", function (e) {
                            if (e.stage === "promulgation")
                                return 3;
                            else {
                                if (e.date === "")
                                    e.date = e.enddate
                                //if e.date<
                                var val = tscale(format.parse(e.enddate)) - tscale(format.parse(e.date))
                                if (val >= 3)
                                    return val - 2;
                                else
                                    return 1
                            }
                        });

                    d3.selectAll(".law-bg").style("opacity", 0.2)

                    d3.selectAll(".tick-lbl").text(function (d, j) {
                        console.log(d, j)
                        return (j + 1) + " mois"
                    })
                    d3.select(".timeline").transition().duration(500).style("opacity", 1)

                    $("#gantt").animate({ scrollTop: "0px",scrollLeft: "0px" });
                    //zooming(1);
                    //$("#mod0-slider").slider( "value", 1 );

                }

                timePosition = function () {

                    //sortByDate();
                    layout = "t";
                    $(".ctrl-sort").hide(400);
                    $(".ctrl-zoom").show(400);
                    d3.selectAll(".g-law").transition().duration(500).attr("transform", function (d, i) {
                        return "translate(0," + (30 + i * (20 + lawh)) + ")"
                    })
                    //d3.selectAll(".row").transition().duration(500).attr("transform", "translate(0,0) scale("+z+",1)" )
                    d3.selectAll(".law-name").transition().duration(500).attr("transform", "translate(0,0)")


                    d3.selectAll(".step")
                        .attr("x", function (e, i) {
                            var val;

                            if(e.overlap) {
                                var mydate=format.parse(e.date);
                                var dd = mydate.getDate()+ e.overlap;
                                var mm = mydate.getMonth()+1;
                                var y = mydate.getFullYear();

                                val = tscale(format.parse(y+"-"+mm+"-"+dd));
                            }
                            else val= tscale(format.parse(e.date));
                            return val;
                        })
                        .attr("width", function (e) {
                        if (e.stage === "promulgation")
                            return 3;
                        else {
                            if (e.date === "")
                                e.date = e.enddate;
                            //if e.date<
                            var val = tscale(format.parse(e.enddate)) - tscale(format.parse(e.date));
                            if (val >= 3)
                                return val - 2;
                            else
                                return 1
                        }
                    });

                    d3.selectAll(".step-lbl")
                        .attr("x", function (e, i) {
                            var val = lblscale(format.parse(e.date));
                            return val
                        });

                    d3.selectAll(".step-ptn")
                        .transition().duration(500)
                        .attr("x", function (e, i) {
                            var val = tscale(format.parse(e.date));
                            return val
                        })
                        .attr("width", function (e) {
                            if (e.stage === "promulgation") return 3;
                            else {
                                if (e.date === "") e.date = e.enddate
                                var val = tscale(format.parse(e.enddate)) - tscale(format.parse(e.date))
                                if (val >= 3) return val - 2;
                                else return 1
                            }
                        });


                    d3.selectAll(".tick-lbl").text(function (d, j) {
                        return tickform(d);
                    });


                    d3.select(".timeline").transition().duration(500).style("opacity", 1)

                    d3.selectAll(".law-bg").style("opacity", 0.2)
                    zooming(10);
                    $("#mod0-slider").slider( "value", 10 );
                    $("#gantt").animate({scrollTop:"0px", scrollLeft: "100000px" });

                };

                quantiPosition = function () {

                    //sortByAmds();
                    zooming(1);
                    $(".ctrl-zoom").hide(400);
                    $(".ctrl-sort").show(400);
                    layout = "q";
                    d3.selectAll(".g-law").transition().duration(500).attr("transform", function (d, i) {
                        return "translate(0," + ( i * (20 + lawh)) + ")"
                    });
                    d3.selectAll(".row").transition().duration(500).attr("transform", "translate(0,-30)")
                    d3.selectAll(".law-name").transition().duration(500).attr("transform", "translate(0,-30)")

                    d3.selectAll(".step")
                        .attr("x", function (d) {
                            return d.qx
                        })
                        .attr("width", function (d) {
                            if (d.stage === "promulgation") return 15; else return d.qw
                        })
                        .style("fill", function (d) {
                            if (d.institution === "assemblee") return "#ced6dd"
                            else if (d.institution === "senat") return "#f99b90"
                            else if (d.institution === "conseil constitutionnel") return "rgb(231, 221, 158)"
                            else if (d.stage === "promulgation") return "#716259"
                            else return "#aea198"
                        });

                        drawLabels();

                    d3.selectAll(".step-ptn")
                        .attr("x", function (d) {
                            return d.qx
                        })
                        .attr("width", function (d) {
                            if (d.stage === "promulgation") return 15; else return d.qw
                        })

                    d3.selectAll(".law-bg").transition().duration(500).style("opacity", 0)
                    d3.select(".timeline").transition().duration(500).style("opacity", 0)
                    $("#gantt").animate({ scrollLeft: "0px" });
                }


                sortByLength = function() {
                    zooming(1);
                    $("#mod0-slider").slider( "value", 1 );
                    $("#gantt svg").empty();
                    writeDefs();
                    lawscont = ganttcontainer.append("g").attr("class", "laws")
                    grid = ganttcontainer.insert('g', ':first-child').attr("class", "grid");

                    dossiers.sort(function(a,b){return b.total_days - a.total_days})
                    addLaws();
                    drawAxis();
                    //$("#gantt").animate({ scrollLeft: 100000 + "px" })

                    if(layout==="q") quantiPosition();
                    if(layout==="a") absolutePosition();


                };

                sortByDate = function() {

                    zooming(1);
                    $("#mod0-slider").slider( "value", 1 );
                    $("#gantt svg").empty();
                    writeDefs();
                    lawscont = ganttcontainer.append("g").attr("class", "laws");
                    grid = ganttcontainer.insert('g', ':first-child').attr("class", "grid");

                    dossiers.sort(function(a,b){return  Date.parse(b.end) - Date.parse(a.end)});
                    addLaws();
                    drawAxis();
                    //$("#gantt").animate({ scrollLeft: 100000 + "px" });

                    if(layout==="q") quantiPosition();
                    if(layout==="a") absolutePosition();
                };

                sortByAmds = function() {

                    zooming(1);
                    $("#mod0-slider").slider( "value", 1 );
                    $("#gantt svg").empty();
                    writeDefs();
                    lawscont = ganttcontainer.append("g").attr("class", "laws");
                    grid = ganttcontainer.insert('g', ':first-child').attr("class", "grid");

                    dossiers.sort(function(a,b){return  b.total_amendements - a.total_amendements});
                    addLaws();
                    drawAxis();
                    //$("#gantt").animate({ scrollLeft: 100000 + "px" })

                    if(layout==="q") quantiPosition();
                    if(layout==="a") absolutePosition();
                };

                function onclick(d) {
                    $(".text-container").show();
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
                        themes.append("<span class='glyphicon glyphicon-tag badge'> "+e+"</span>&nbsp;&nbsp;");
                    }),
                        mots=1000*(Math.round(d.total_mots / 1000.));
                    $(".text-container").empty()
                        .append("<p><b>"+capitalize(d.long_title)+"</b></p>")
                        .append('<p><span class="glyphicon glyphicon-calendar"></span>&nbsp;&nbsp;' + french_date(d.beginning) + " →  " + french_date(d.end) + "</p>")
                        .append("<p>(" + d.procedure.toLowerCase().replace('normale', 'procédure normale') + ")</p>")
                        .append("<p><small>"+themes.html()+"</small></p>")
                        .append('<p><span class="glyphicon glyphicon-folder-open" style="opacity: '+opacity_amdts(d.total_amendements)+'"></span>&nbsp;&nbsp;'+(d.total_amendements?d.total_amendements:'aucun')+" amendement"+(d.total_amendements>1?'s déposés':' déposé')+" sur ce texte</p>")
                        .append('<p><span class="glyphicon glyphicon-comment" style="opacity: '+opacity_mots(d.total_mots)+'"></span>&nbsp;&nbsp;plus de '+(mots?mots:'1')+" mille mots prononcés en débats parlementaires</p>")
                        .append("<p><small>(sources : <a href='" + d.url_dossier_assemblee + "'>dossier Assemblée</a> &mdash; <a href='" + d.url_dossier_senat + "'>dossier Sénat</a>)</small></p>")
                        .append('<div class="gotomod"><a class="btn btn-info" href="mod1?l=' + d.id + '">Explorer les articles</a></div>');

                }
            });
        };

        return vis;
    };

    thelawfactory.mod0_bars = function () {

        function vis(selection) {

            var barcontainer = d3.select("#bars")
            var width = parseInt(barcontainer.style("width"))
            //var width = parseInt(barcontainer.style("width"))
            var bscale = d3.scale.linear().range([0, 60]);


            selection.each(function (json) {

                //json=groupStats(3,json);

                console.log(json)

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

                console.log(width, l)
                var w = width / l


                d3.entries(json).forEach(function (e, i) {
                    var step = barcontainer
                        .append("div")
                        .attr("class", "bar-step")
                        .attr("style", "width:" + (w * 93 / 100) + "px; margin-right:" + (w * 5 / 100) + "px");

                    step.append("div")
                        .attr("class", "bar-value")
                        .attr("style", "height:" + bscale(e.value) + "px; width:100%; top:" + bscale(m - e.value) + "px");

                    step.append("div")
                        .attr("class", "bar-key")
                        .text(function () {
                            if (e.key === threshold) return e.key / 30 + "+ mois";
                            else return e.key / 30 + " mois";
                        })
                        .attr("style", "top:" + (bscale(m - e.value) + 5) + "px; font-size:" + d3.min([(w * 4 / 10), 10]) + "px");
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
