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
                today = new Date(),
                lawh = 50,
                z = 1,
                steph = lawh - 16
            ticks = d3.time.months(mindate, today, 1);


            tscale.domain([mindate, today]);
            lblscale.domain([mindate, today]);
            qscale.domain([0, today]);
            ganttcontainer.attr("width", width).attr("height", 2900);


            var zoom = d3.behavior.zoom()
                .scaleExtent([1, 10])
                .on('zoom', zooming);


            ganttcontainer.call(zoom);
            var lawscont = ganttcontainer
                .append("g")
                .attr("class", "laws")


            function drawLabels() {
                d3.selectAll(".g-law").append("g").attr("class", "lbls")
                    .selectAll(".step-lbl").data(function (d) {
                        return d.steps
                    })
                    .enter()
                    .append("text")
                    .attr("class", "step-lbl")
                    .attr("x", function (e, i) {
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
                    })
                    .attr("y", 38)
                    .attr("dx", 1.5)
                    .text(function (d) {
                        if(d.institution==="assemblee" || d.institution==="senat") {
                            return d.step.substr(0, 1).toUpperCase()
                        }
                        else return d.institution.substr(0, 1).toUpperCase()
                    })
                    .style("fill", "white")
                    .style("font-size", 10 + "px")
            }

            function zooming() {

                if(layout==="q") return;
                if(d3.event && d3.event.scale) z = d3.event.scale;
                else z=1;

                d3.selectAll(".steps").attr("transform", "scale(" + z + ",1)");
                d3.selectAll(".law-bg").attr("transform", "scale(" + z + ",1)");

                if(layout==="a") {
                    d3.selectAll(".g-law").attr("transform", function(d,i){return  "translate(" + (-d.xoffset*z+5) + ","+ (30 + i * (20 + lawh)) +")"});
                    //d3.selectAll(".law-bg").attr("transform", function(d,i){return  "translate(" + (-d.xoffset*z+5) + ","+ (30 + i * (20 + lawh)) +")"});
                }

                d3.selectAll(".row").attr("transform", "scale(" + z + ",1)");
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
                else if (!d3.selectAll(".lbls")[0].length) {
                    drawLabels();
                }

                d3.selectAll(".tick").attr("x1",function(d){return tscale(d)*z}).attr("x2",function(d){return tscale(d)*z})
            };



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


            var grid = ganttcontainer.insert('g', ':first-child').attr("class", "grid");


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
                        if (d.steps[0].date === "" || d.steps[0].date < d.beginning)
                            st = tscale(format.parse(d.beginning))
                        else
                            st = tscale(format.parse(d.steps[0].date))
                        d.xoffset = st;

                        d.steps.forEach(function (e, j) {

                            //if (j == 0 && (e.date === "" || e.date < d.beginning)) e.date = d.beginning
                            if (e.date && e.date != "" && e.enddate < e.date) e.enddate = e.date
                            if (!e.date || e.date === "") e.date = e.enddate;

                            if(j>0 && d.steps[j-1].enddate == e.date) {
                                if(d.steps[j-1].overlap) e.overlap=d.steps[j-1].overlap+1;
                                else e.overlap=1
                            }

                            if(j>0 && d.steps[j-1].overlap) {
                                var pastdate=format.parse(d.steps[j-1].enddate);
                                var dd = pastdate.getDate()+1;
                                var mm = pastdate.getMonth()+1;
                                var y = pastdate.getFullYear();
                                console.log()
                                if(e.date===y+"-"+mm+"-"+dd) e.overlap=1;
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
                            $("#gantt").animate({ scrollLeft: 100000 + "px" })
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


                            var div;
                            var start = d.date, end = d.enddate, inst = d.institution, stage = d.stage, step = d.step, amds = d.nb_amendements, source = d.source_url
                            div = d3.select(document.createElement("div")).style("width", "100%")

                            div.append("p").text("Start : " + start);
                            div.append("p").text("End : " + end);
                            div.append("p").text("Institution : " + inst);
                            div.append("p").text("Stage : " + stage);
                            if (d.institution=="assemblee" || d.institution=="senat") {
                                div.append("p").text("Step : " + step);
                                div.append("p").text("Amendements : " + amds);
                                //div.append("<a href='"+source+"'>Detail</a>")
                            }
                            return {
                                title: "Step " + i,
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
                            else if (d.institution === "conseil constitutionnel") return "#e2d793"
                            else if (d.stage === "promulgation") return "#d50053"
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
                    layout = "a";

                    d3.selectAll(".g-law").transition().duration(500).attr("transform", function (d, i) {
                        return "translate(" + (-d.xoffset*z + 5) + "," + (30 + i * (20 + lawh)) + ")"
                    })
                    d3.selectAll(".row").transition().duration(500).attr("transform", "translate(0,0) scale("+z+",1)")
                    d3.selectAll(".law-name").transition().duration(500).attr("transform", "translate(0,0)")


                    d3.selectAll(".step").attr("x", function (e, i) {
                        var val = tscale(format.parse(e.date));

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

                    d3.selectAll(".step-lbl")
                        .attr("x", function (e, i) {
                            var val = lblscale(format.parse(e.date)) + 1;
                            return val
                        })

                    d3.selectAll(".step-ptn")
                        .transition().duration(500)
                        .attr("x", function (e, i) {
                            var val = tscale(format.parse(e.date));
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
                        if (j == 0) return (j + 1) + " month";
                        else return (j + 1) + " months"
                    })
                    d3.select(".timeline").transition().duration(500).style("opacity", 1)
                    $("#gantt").animate({ scrollLeft: "0px" });

                }

                timePosition = function () {
                    layout = "t";
                    d3.selectAll(".g-law").transition().duration(500).attr("transform", function (d, i) {
                        return "translate(0," + (30 + i * (20 + lawh)) + ")"
                    })
                    d3.selectAll(".row").transition().duration(500).attr("transform", "translate(0,0) scale("+z+",1)" )
                    d3.selectAll(".law-name").transition().duration(500).attr("transform", "translate(0,0)")


                    d3.selectAll(".step").attr("x", function (e, i) {
                        var val = tscale(format.parse(e.date));

                        return val
                    }).attr("width", function (e) {
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
                            var val = lblscale(format.parse(e.date)) + 1;
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
                    $("#gantt").animate({ scrollLeft: "100000px" });
                };

                quantiPosition = function () {
                    zoom.scale(1);
                    zooming();
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
                            else if (d.stage === "promulgation") return "#d50053"
                            else return "#aea198"
                        });


                    if (!d3.selectAll(".lbls")[0].length) {
                        d3.selectAll(".g-law").append("g").attr("class", "lbls")
                            .selectAll(".step-lbl").data(function (d) {
                                return d.steps
                            })
                            .enter()
                            .append("text")
                            .attr("class", "step-lbl")
                            .attr("x", function (e, i) {
                                var val = lblscale(format.parse(e.date)) + 1;
                                return val
                            })
                            .attr("y", 38)
                            .text(function (d) {
                                return d.institution.substr(0, 1).toUpperCase()
                            })
                            .style("fill", "white")
                            .style("font-size", 10)
                    }

                    d3.selectAll(".step-lbl")
                        .attr("x", function (d) {
                            return d.qx + 4
                        })


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


                function onclick(d) {
                    console.log("clicked")
                    d3.selectAll(".curr")
                        .classed("curr", false)
                        .style("fill", "#f3efed")
                        .style("opacity", 0.3)

                    d3.select("." + d.id)
                        .classed("curr", true)
                        .style("fill", "#fff")
                        .style("opacity", 0.6)

                    //d3.select(this).classed("curr", true);
                    //var titre = d.article, section = d.section, status = d['id_step'].split('_').slice(1,4).join(', '), length = d['length'];
                    $("#text-title").text(d.short_title);
                    $(".text-container").empty();
                    $(".text-container").append("<p><b>Title :</b> " + d.long_title + "</p>")
                    $(".text-container").append("<p><b>Start :</b> " + d.beginning + "</p>")
                    $(".text-container").append("<p><b>End :</b> " + d.end + "</p>")
                    $(".text-container").append("<p><b>Themes :</b> " + d.themes.join(", ") + "</p>")
                    $(".text-container").append("<p><b>Procedure :</b> " + d.procedure + "</p>")
                    $(".text-container").append("<p><b>Amendements :</b> " + d.total_amendements + "</p>")
                    $(".text-container").append("<p><b>Interventions word count :</b> " + d.total_mots + "</p>")
                    $(".text-container").append("<p><b>Dossiers: </b><a href='" + d.url_dossier_assemblee + "'>Assemblee</a>, <a href='" + d.url_dossier_senat + "'>Senat</a></p>");
                    $(".text-container").append('<div class="gotomod1"><a class="btn"  href="mod1?l=' + d.id + '">View articles</a></div>')

                    console.log(d);
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
                            if (e.key / 30 == 1) return e.key / 30 + " month";
                            else if (e.key === threshold) return e.key / 30 + "+ months";
                            else return e.key / 30 + " months";
                        })
                        .attr("style", "top:" + (bscale(m - e.value) + 5) + "px; font-size:" + d3.min([(w * 4 / 10), 12]) + "px");
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
