'use strict';

(function () {

    var thelawfactory = window.thelawfactory || (window.thelawfactory = {});

    var utils = thelawfactory.utils;

    thelawfactory.mod1 = function (currentstep, onClickCb) {
        var self = {
            aligned: true,
            drawing: false,
            stacked: false,
            bigList: [],
            valign: function() {},
            stack: function() {}
        };

        self.vis = function (selection) {
            selection.each(function (data) {
                self.bigList = [];
                var art = d3.values(data.articles);

                art.sort(utils.articleSort);

                //compute stages and sections
                var stages = utils.computeStages(art),
                    columns = stages.length + (currentstep ? 1 : 0),
                    sections = utils.computeSections(art),
                    sectHeight = 15,
                    sectJump = 25;

                if (sections.length < 2 && art.length == 1)
                    $("#menu-display .dropdown-toggle").addClass('disabled');

                art.forEach(function (d, i) {
                    d.steps.forEach(function (f, j) {
                        self.bigList.push(f);
                    });
                });

                var maxlen = d3.max(art, function (d) {
                    return d3.max(d.steps, function (e) {
                        return e.length;
                    })
                });

                //linear mapper for article height
                var lerp = d3.scale.linear().domain([0, 1, maxlen]).range([0, 12, 120]);

                //set color scale for diff
                var levmin = 145, levmax = levmin + 100;
                self.diffcolor = d3.scale.linear().range(["rgb(" + [levmax, levmax, levmax].join(',') + ")", "rgb(" + [levmin, levmin, levmin].join(',') + ")"]).domain([0, 1]).interpolate(d3.interpolateHcl);

                var margin, width, colwidth, longlabel, maxy, svg;
                var prepareSizes = function () {
                    //margins
                    margin = {
                        top: 0,
                        right: 10,
                        bottom: 20,
                        left: 0
                    };
                    width = $("#viz").width();
                    colwidth = width / columns - 30;
                    longlabel = (colwidth < 120 ? (colwidth < 80 ? 0 : 1) : 2);
                };

                function article_hover(d) {
                    var div = d3.select(document.createElement("div")).style("width", "100%");
                    if (d.section.lastIndexOf("A", 0) !== 0)
                        div.append("p").html("<small>" + (utils.test_section_details(data.sections, d.section, d.id_step, 'newnum') ? utils.titre_section(data.sections[d.section][d.id_step]['newnum'], 2) + " (" + utils.format_section(d, 1) + ')' : utils.format_section(d, 2)) + "</small>");
                    div.append("p").html("<small>" + utils.titre_etape(d) + "</small>");
                    if (d.n_diff == 0) div.append('p').text(d.status == "sup" ? "Supprimé à cette étape" : "Aucune modification");
                    else if (d.n_diff == 1 && d.id_step.substr(-5) !== "depot") div.append("p").text((d.prev_step ? "Réintroduit" : "Ajouté") + " à cette étape");
                    else if (d.id_step.substr(-5) != "depot") div.append("p").html("Modifications : " + d3.round(d['n_diff'] * 100, 2) + "&nbsp;%");
                    div.append("p").html("<small>Longueur du texte : " + d['length'] + " caractères</small>");
                    return {
                        title: utils.clean_premier(utils.titre_article(d, 2)),
                        content: div,
                        placement: "mouse",
                        gravity: "bottom",
                        displacement: [-120, 20],
                        mousemove: true
                    };
                }

                function section_hover(d) {
                    var title,
                        title_details,
                        div = d3.select(document.createElement("div")).style("width", "100%");
                    div.append("p").html("<small>" + utils.titre_etape(d) + "</small>");
                    if (utils.test_section_details(data.sections, d.section, d.id_step, 'title') && d.section == "echec") {
                        title = d.status;
                        title_details = utils.get_section_details(data.sections, d.section, d.id_step, 'title');
                    } else {
                        if (utils.test_section_details(data.sections, d.section, d.id_step, 'newnum')) {
                            var newnum = utils.get_section_details(data.sections, d.section, d.id_step, 'newnum');
                            title = utils.titre_section(newnum, 2) + " (" + utils.num_sub_section(d.section) + ")";
                            title_details = utils.titre_section(newnum.replace(utils.sub_section(newnum), ''), 2) + " (" + utils.format_section(d, 1) + ')';
                        } else {
                            title = utils.titre_section(d.section, 2);
                            title_details = utils.titre_parent(d.section, 2);
                        }
                        title += (utils.test_section_details(data.sections, d.section, d.id_step, 'title') ? " : " + utils.get_section_details(data.sections, d.section, d.id_step, 'title') : "");
                    }
                    if (title_details) div.append("p").html("<small>" + title_details + "</small>");
                    return {
                        title: utils.clean_premier(title),
                        content: div,
                        placement: "mouse",
                        gravity: "bottom",
                        displacement: [-140, 15],
                        mousemove: true
                    };
                }

                var drawArticles = function () {
                    var firstmade = false, firstamade = false; // to class the first article which has a rect (for tuto)

                    //init coordinates
                    utils.setMod1Size();
                    prepareSizes();
                    setCoordinates();

                    maxy = Math.max($("#viz").height(), d3.max(self.bigList, function (d) {
                            return d.y + lerp(d.length)
                        }) + 50);

                    //create SVG
                    $("svg").remove();
                    svg = d3.select("#viz").append("svg").attr("width", "100%").attr("height", maxy).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                    //draw everything
                    var st, se;
                    for (st in stages) {
                        for (se in sections) {
                            var datarts = self.bigList.filter(function (d) {
                                return (d.length > 0 && d.step_num == st && d.sect_num == se)
                            });
                            var group = svg.append("g")
                                .attr("class", "group se" + se + " st" + st);

                            if (datarts.length && !firstmade && st > 1) {
                                firstmade = true;
                                group.classed('group-first', true);
                            }

                            //Add articles
                            group.selectAll(".article")
                                .data(datarts)
                                .enter().append("rect")
                                .attr("id", function (d) {
                                    return ("art-" + d.step_num + "-" + d.article).replace(/\s/g, '')
                                })
                                .attr("x", function (d) {
                                    return d.x
                                })
                                .attr("y", function (d) {
                                    return d.y
                                })
                                .attr("width", colwidth)
                                .attr("height", function (d) {
                                    return lerp(d.length)
                                })
                                .attr("class", function (d) {
                                    return "article " + d.section.replace(/ |<|\/|>|/g, "") + " sect" + utils.findStage(d.id_step);
                                })
                                .classed('article-first', function (d, j) {
                                    if (!firstamade && st > 2 && d.n_diff && d.status != "new") {
                                        firstamade = true;
                                        return true;
                                    }
                                    return false;
                                })
                                .call(self.styleRect)
                                .on("click", self.onclick)
                                .popover(article_hover);

                            //Add green labels for new elements
                            group.selectAll(".new")
                                .data(self.bigList.filter(function (d) {
                                    return (d.length > 0 && d.step_num == st && d.sect_num == se && (d.id_step.substr(-5) === "depot" || d.status === "new"))
                                }))
                                .enter().append("rect")
                                .attr("class", "new")
                                .style("stroke", "none")
                                .style("fill", '#8DF798')
                                .attr("y", function (d) {
                                    return d.y + 1
                                })
                                .attr("x", function (d) {
                                    return d.x + 1
                                })
                                .attr("height", function (d) {
                                    return lerp(d.length) - 2
                                })
                                .attr("width", 6)
                                .on("click", self.onclick)
                                .popover(article_hover);

                            //Add red labels for removed elements
                            group.selectAll(".sup")
                                .data(self.bigList.filter(function (d) {
                                    return (d.length > 0 && d.step_num == st && d.sect_num == se && d.status === "sup")
                                }))
                                .enter().append("rect")
                                .attr("class", "sup")
                                .style("stroke", "none")
                                .style("fill", '#FD5252')
                                .attr("y", function (d) {
                                    return d.y + 1
                                })
                                .attr("x", function (d) {
                                    return d.x + 1
                                })
                                .attr("height", function (d) {
                                    return lerp(d.length) - 2
                                })
                                .attr("width", 6)
                                .on("click", self.onclick)
                                .popover(article_hover);

                            //Add headers
                            group.selectAll(".header")
                                .data(self.bigList.filter(function (d) {
                                    return (d.step_num == st && d.sect_num == se && d.head)
                                }))
                                .enter().append("rect")
                                .attr("x", function (d) {
                                    return d.x
                                })
                                .attr("y", function (d) {
                                    return d.y - sectHeight
                                })
                                .attr("class", "header")
                                .attr("width", colwidth)
                                .attr("height", function (d) {
                                    return (d.section === 'echec' ? maxy - 50 : sectHeight);
                                })
                                .style("fill", function (d) {
                                    return (d.section === 'echec' ? "#FD5252" : "#716259")
                                })
                                .style("stroke", "none")
                                .style("opacity", function (d) {
                                    return utils.section_opacity(d.section)
                                })
                                .popover(function (d) {
                                    return (d.section.lastIndexOf("A", 0) === 0 ? article_hover(d) : section_hover(d))
                                })
                                .filter(function (d) {
                                    return d.section.lastIndexOf("A", 0) === 0
                                }).on("click", self.onclick);

                            group.selectAll(".header")
                                .filter(function (d) {
                                    return d.head > 1
                                })
                                .each(function (d) {
                                    var lastS, curS = d.section,
                                        ct = 1;
                                    while (ct < d.head) {
                                        ct++;
                                        lastS = utils.sub_section(curS);
                                        curS = d.section.substr(0, curS.length - lastS.length);
                                        group.append("rect")
                                            .attr("x", d.x)
                                            .attr("y", d.y - ct * sectHeight)
                                            .attr("class", "header")
                                            .attr("width", colwidth)
                                            .attr("height", sectHeight)
                                            .style("fill", "#716259")
                                            .style("stroke", "none")
                                            .style("opacity", utils.section_opacity(curS))
                                            .popover(function () {
                                                return section_hover(d)
                                            });
                                    }
                                });

                            //Add header labels
                            group.selectAll(".head-lbl")
                                .data(self.bigList.filter(function (d) {
                                    return (d.step_num == st && d.sect_num == se && d.head);
                                }))
                                .enter().append("text")
                                .attr("x", function (d) {
                                    return d.x - 2 + colwidth / 2
                                })
                                .attr("y", function (d) {
                                    return d.y - (d.section === 'echec' ? 2 : 4)
                                })
                                .attr("class", "head-lbl")
                                .attr("font-family", "sans-serif")
                                .attr("text-anchor", "middle")
                                .attr("letter-spacing", "0.2em")
                                .attr("font-size", function (d) {
                                    return (d.section === 'echec' ? '10px' : '9px')
                                })
                                .attr("font-weight", "bold")
                                .style("fill", 'white')
                                .text(function (d) {
                                    if (data.sections && d.section === 'echec') return d.status;
                                    var sec;
                                    if (d.section.lastIndexOf("A", 0) === 0) sec = d;
                                    else sec = utils.sub_section(utils.test_section_details(data.sections, d.section, d.id_step, 'newnum') ? data.sections[d.section][d.id_step]['newnum'] : d.section)
                                    return utils.clean_premier(utils.format_section(sec, longlabel));
                                })
                                .popover(function (d) {
                                    return (d.section.lastIndexOf("A", 0) === 0 ? article_hover(d) : section_hover(d))
                                })
                                .filter(function (d) {
                                    return d.section.lastIndexOf("A", 0) === 0
                                }).on("click", self.onclick);

                            group.selectAll(".head-lbl")
                                .filter(function (d) {
                                    return d.head > 1
                                })
                                .each(function (d) {
                                    var lastS, curS = d.section,
                                        ct = 1;
                                    while (ct < d.head) {
                                        lastS = utils.sub_section(curS);
                                        curS = d.section.substr(0, curS.length - lastS.length);
                                        group.append("text")
                                            .attr("x", d.x - 2 + colwidth / 2)
                                            .attr("y", d.y - 4 - ct * sectHeight)
                                            .attr("class", "head-lbl")
                                            .attr("font-family", "sans-serif")
                                            .attr("text-anchor", "middle")
                                            .attr("letter-spacing", "0.2em")
                                            .attr("font-size", '9px')
                                            .attr("font-weight", "bold")
                                            .style("fill", 'white')
                                            .popover(function () {
                                                return section_hover(d)
                                            })
                                            .text(utils.clean_premier(utils.titre_section(utils.sub_section(curS), longlabel)));
                                        ct++;
                                    }
                                });
                        }
                    }

                    if (!firstamade)
                        d3.select('rect.article').classed("article-first", true);

                    //Add connections
                    var lines = svg.append("g").selectAll("line").data(self.bigList.filter(function (d) {
                        var a = d3.selectAll(".article").filter(function (e) {
                            return (d.article == e.article && d.step_num == e.prev_step)
                        });
                        return !a.empty() && d.status != "sup";
                    })).enter();

                    lines.append("line")
                        .attr("x1", function (d) {
                            return d.x + colwidth;
                        })
                        .attr("y1", function (d) {
                            return d.y + (lerp(d.length)) / 2
                        })
                        .attr("x2", function (d) {
                            return self.bigList.filter(function (e) {
                                return d.article == e.article && d.step_num == e.prev_step
                            })[0].x
                        })
                        .attr("y2", function (d) {
                            var a = self.bigList.filter(function (e) {
                                return d.article == e.article && d.step_num == e.prev_step
                            })[0];
                            return a.y + (lerp(a.length)) / 2;
                        })
                        .style("stroke", "#d0d0e0")
                        .style("stroke-width", 1);

                    //======================
                    //Visualization flow ends here
                    //======================

                    function setCoordinates() {
                        for (var t in stages) {
                            var currT = self.bigList.filter(function (d) {
                                    return d.step_num == t;
                                }),
                                currY = sectJump + sectHeight,
                                piece,
                                lastS = "";

                            for (var s in sections) {
                                var currentSection = currT.filter(function (e) {
                                    return e.sect_num == s;
                                })
                                    .sort(function (a, b) {
                                        return a.order - b.order;
                                    });

                                if (currentSection.length) {
                                    var currIdx;
                                    currentSection.forEach(function (f, k) {
                                        if (k == 0) {
                                            currIdx = k;
                                            currentSection[currIdx].head = 1;
                                        }

                                        f.y = currY;
                                        f.x = f.step_num * width / columns + 10;
                                        currY += lerp(f.length) + 1;
                                    });

                                    // Identify section jumps
                                    var lastsplit = utils.split_section(lastS),
                                        cursplit = utils.split_section(currentSection[currIdx].section),
                                        newpiece = "";

                                    while (lastsplit.length) {
                                        piece = newpiece = "";
                                        while (lastsplit.length && !piece) piece = lastsplit.shift();
                                        while (cursplit.length && !newpiece) newpiece = cursplit.shift();
                                        if (newpiece != piece) break;
                                    }

                                    while (cursplit.length) if (cursplit.shift()) currentSection[currIdx].head += 1;

                                    currY += currentSection[currIdx].head * sectHeight + sectJump;

                                    if (currentSection[currIdx].head > 1) currentSection.forEach(function (f) {
                                        f.y += currentSection[currIdx].head * sectHeight;
                                    });

                                    lastS = currentSection[currIdx].section;
                                }
                            }
                        }
                    }

                    //USE THE ARROWS
                    d3.select("body").on("keydown", function () {
                        var c = (d3.select(".curr")), sel, elm;
                        if (self.tutorial) return;
                        if (c.empty()) return;
                        var cur = c.datum();

                        //LEFT
                        if (d3.event.keyCode == 37) {
                            sel = d3.selectAll(".article").filter(function (e) {
                                return e.article == cur.article && cur.prev_step == e.step_num
                            })
                        }
                        //RIGHT
                        else if (d3.event.keyCode == 39) {
                            sel = d3.selectAll(".article").filter(function (e) {
                                return e.article == cur.article && e.prev_step == cur.step_num
                            })
                        }
                        //UP AND DOWN
                        else if (d3.event.keyCode == 38 || d3.event.keyCode == 40) {
                            d3.event.preventDefault();
                            var g = $(".curr").parent(),
                                curn = $(c.node());

                            //UP
                            if (d3.event.keyCode == 38) {
                                if (curn.prev().length)
                                    elm = d3.select(curn.prev().get([0]))
                                else {
                                    var a = $(".group.st" + cur.step_num + ":lt(" + cur.sect_num + "):parent:last");
                                    if (a.length)
                                        elm = d3.select(a.children(".article").last().get([0]))
                                }
                            }
                            //DOWN
                            else if (d3.event.keyCode == 40) {
                                if (curn.next().length && d3.select(curn.next().get([0])).classed("article"))
                                    elm = d3.select(curn.next().get([0]));
                                else {
                                    var a = $(".group.st" + cur.step_num + ":gt(" + cur.sect_num + "):parent");
                                    if (a.length)
                                        elm = d3.select(a.children().get([0]))
                                }
                            }
                        }

                        if (sel && !sel.empty()) sel.each(self.onclick);
                        else if (elm) {
                            $("#viz").animate({scrollTop: elm.node().getBBox().y - 20}, 200);
                            elm.each(self.onclick);
                        }
                    });


                    //functions for aligned layout
                    var has_echec = sections.indexOf('echec') >= 0;

                    self.valign = function () {
                        self.aligned = true;
                        self.stacked = false;
                        var y0 = 0;
                        for (var se = 0; se < sections.length; se++) {
                            if (has_echec && se == 0) continue;
                            var h = 0;
                            for (var st in stages) {
                                var a = d3.select(".se" + se + ".st" + st).node().getBBox();
                                y0 = Math.max(y0, a.y);
                                h = Math.max(h, a.height + 20);
                            }
                            d3.selectAll(".se" + (se))
                                .attr("data-offset", function (d) {
                                    var b = d3.select(this).node().getBBox();
                                    return y0 - b.y;
                                });
                            y0 += h;
                        }

                        $("svg").height(Math.max(y0, maxy));

                        d3.selectAll(".group").transition().duration(500)
                            .attr("transform", function (d) {
                                if ($(this).attr("data-offset")) return "translate(0," + parseFloat($(this).attr('data-offset')) + ")"
                                else return "translate(0,0)";
                            });

                        valignLines();
                    };

                    function valignLines() {
                        d3.selectAll("line").transition().duration(500)
                            //.style("opacity","1")
                            .attr("y1", function (d) {
                                if (!d.hs) {
                                    var hs = $("g.se" + d.sect_num + ".st" + d.step_num).attr("data-offset");
                                    if (!hs) hs = 0;
                                    d.hs = parseFloat(hs)
                                }
                                return d.hs + d.y + (lerp(d.length)) / 2
                            })
                            .attr("y2", function (d) {

                                var a = self.bigList.filter(function (e) {
                                    return e.article === d.article && e.prev_step == d.step_num
                                })[0];
                                if (!a.he) {
                                    var he = $("g.se" + a.sect_num + ".st" + a.step_num).attr("data-offset");
                                    if (!he) he = 0;
                                    a.he = parseFloat(he)
                                }
                                return a.he + a.y + (lerp(a.length)) / 2;
                            });
                    }

                    //function for stacked layout
                    self.stack = function () {
                        self.isStacked = true;
                        self.isAligned = false;
                        d3.selectAll(".group").transition().duration(500)
                            .attr("transform", "translate(0,0)");

                        d3.selectAll("line").transition().duration(500)
                            .attr("y1", function (d) {
                                return d.y + (lerp(d.length)) / 2
                            })
                            .attr("y2", function (d) {
                                var a = self.bigList.filter(function (e) {
                                    return e.article === d.article && e.prev_step == d.step_num
                                })[0];
                                return a.y + (lerp(a.length)) / 2;
                            });
                        $("svg").height(maxy);
                    };

                    if (self.isAligned) self.valign();
                    else self.stack();
                    $('.readMode').tooltip({animated: 'fade', placement: 'bottom'});
                    $('.revsMode').tooltip({animated: 'fade', placement: 'bottom'});
                    setTimeout(utils.setTextContainerHeight, 500);
                };

                drawArticles();
            });
        };

        self.onclick = function (d) {
            d3.selectAll("line").style("stroke", "#d0d0e0")
                .style("stroke-dasharray", "none");
            //STYLE OF CLICKED ELEMENT AND ROW
            //Reset rectangles
            d3.selectAll(".article").call(self.styleRect);
            d3.selectAll(".curr").classed("curr", false);

            d3.select(this).classed("curr", true);

            //Select the elements in same group
            d3.selectAll(".article")
                .filter(function (e) {
                    return e && d && e.article == d.article
                })
                .style("stroke", "#333344").style("stroke-width", 1).style("fill", function () {
                    var hsl = d3.rgb(d3.select(this).style("fill")).hsl();
                    hsl.s += 0.1;
                    return hsl.rgb()
                })
                .style("stroke-dasharray", [3, 3]);

            d3.select(this).style("stroke-dasharray", "none");
            d3.selectAll("line")
                .filter(function (e) {
                    return e && d && e.article == d.article
                })
                .style("stroke", "#333344")
                .style("stroke-dasharray", [3, 3]);

            d3.rgb(d3.select(this).style("fill")).darker(2);

            if (self.drawing) return;

            if (onClickCb && onClickCb.call)
                onClickCb(d);
        };

        self.styleRect = function(d) {
            d.style("stroke", "#d0d0e0")
                .style("stroke-width", 1)
                .style("stroke-dasharray", "none")
                .style("fill", function (f) {
                    return (!f || f.status == 'sup' || f.id_step.substr(-5) === "depot" || f.n_diff == 0 ? '#fff' : self.diffcolor(f.n_diff));
                });
        };

        return self;
    };
})();
