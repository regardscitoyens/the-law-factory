var valign, stacked, articlesScope, aligned = true;

(function () {

    var thelawfactory = window.thelawfactory || (window.thelawfactory = {});

    thelawfactory.articles = function () {

        articlesScope = $(".articles").scope();
        var textArticles = {};

        function titre_etape(article) {
            return article['id_step']
                .replace('CMP_CMP', 'CMP')
                .split('_')
                .slice(1, 4)
                .map(function (d) {
                    return thelawfactory.utils.getLongName(d);
                }
            ).join(' ⋅ ');
        }

        function clean_premier(s) {
            return (s ? s.replace(/1(<sup>)?er(<\/sup>)?/ig, '1') : '');
        }

        function split_section(s) {
            s = s.replace(/<[^>]*>/g, '');
            return s.split(/([ALTCVS]+\d+[\s<\/>a-z]*(?:[A-Z]+$)?)/);
        }

        function sub_section(s) {
            s = split_section(s);
            return s.length > 1 ? s[s.length - 2] : s[0];
        }

        function num_sub_section(s) {
            return sub_section(s).replace(/^[LTCVS]+/, '');
        }

        function titre_parent(s, length) {
            s = split_section(s);
            if (s.length > 1) s = s.slice(0, s.length - 2);
            return titre_section(s.join(''), length);
        }

        function titre_section(s, length) {
            if (!s) return s;
            var res = "",
                s = split_section(s);
            var i, sLen = s.length;
            for (i = 0; i < sLen; ++i) {
                if (s[i]) {
                    res += (res ? " ⋅ " : "");
                    res += s[i].replace(/([LTCVS]+)(\d+e?r?)\s*([\sa-z]*)/, '$1 $2 $3')
                        .replace(/1er?/g, '1<sup>er</sup>')
                        .replace(/^SS( \d)/, (length ? (length == 1 ? "S-Sec." : "Sous-section") : "SS") + '$1')
                        .replace(/^S( \d)/, (length ? (length == 1 ? "Sect." : "Section") : "S") + '$1')
                        .replace("C ", (length ? (length == 1 ? "Chap." : "Chapitre") : "C") + " ")
                        .replace("V ", (length ? (length == 1 ? "Vol." : "Volume") : "V") + " ")
                        .replace("L ", (length ? "Livre" : "L") + " ")
                        .replace("T ", (length ? "Titre" : "T") + " ");
                }
            }
            return res;
        }

        function titre_article(article, length) {
            var num = (article.newnum != undefined ? article.newnum : article.article)
                    .replace(/1er?/, '1'),
                newnum = (article.newnum != undefined ? " (" + article.article + ")" : "")
                    .replace(/1er?/, '1<sup>er</sup>'),
                res = (length ? (length == 1 ? "Art." : "Article ") : "A ");
            return res + num + newnum;
        }

        function section_opacity(s) {
            if (!s) return 0.95;
            if (s === "echec") return 0.35;
            if (s.lastIndexOf("A", 0) === 0)
                return 0.65;
            try {
                return 0.95 - 0.12 * (split_section(s).filter(function (d) {
                        return d != "";
                    }).length - 1);
            } catch (e) {
                console.log("ERREUR section with bad id:", s, e);
                return 0.95;
            }
        }

        function diff_to_html(diffs) {
            var html = [];
            for (var x = 0; x < diffs.length; x++) {
                var text = diffs[x][1].replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;').replace(/>/g, '&gt;'),
                    typ = 'span';
                if (diffs[x][0] != 0) {
                    typ = 'del';
                    if (diffs[x][0] == 1) typ = 'ins';
                }
                html.push('<' + typ + '>' + text.replace(/\n/g, '</' + typ + '></li><li><' + typ + '>') + '</' + typ + '>');
            }
            return html.join('');
        }

        function vis(data, APIRootUrl, loi, currentstep, helpText) {
            var drawing = false,
                bigList = [],
                art = d3.values(data.articles);

            art.sort(function (a, b) {
                if (a.section === "echec") return (b.section === "echec" ? 0 : -1);
                else if (b.section === "echec") return 1;
                var al = a.titre.split(" "), bl = b.titre.split(" "),
                    ao = 0, bo = 0;
                if (parseInt(al[0]) != parseInt(bl[0]))
                    return parseInt(al[0]) - parseInt(bl[0]);
                for (var i_s = 0; i_s < a.steps.length; i_s++) {
                    ao += a.steps[i_s]['order'];
                    for (var j_s = 0; j_s < b.steps.length; j_s++) {
                        if (i_s == 0)
                            bo += b.steps[j_s]['order'];
                        if (a.steps[i_s]['id_step'] == b.steps[j_s]['id_step'])
                            return a.steps[i_s]['order'] - b.steps[j_s]['order'];
                    }
                }
                return ao / a.steps.length - bo / b.steps.length;
            });

            // Dynamic load of articles text at each step
            function load_texte_articles() {
                var delay = 50;
                d3.set(bigList.map(function (d) {
                    return d.directory;
                })).values().sort()
                    .forEach(function (d) {
                        delay += 50;
                        setTimeout(function () {
                            d3.json(encodeURI(APIRootUrl + loi + "/procedure/" + d + "/texte/texte.json"), function (error, json) {
                                json.articles.forEach(function (a) {
                                    if (!textArticles[a.titre]) textArticles[a.titre] = {};
                                    textArticles[a.titre][d] = [];
                                    Object.keys(a.alineas).sort().forEach(function (k) {
                                        textArticles[a.titre][d].push(a.alineas[k]);
                                    });
                                });
                                to_load -= 1;
                            });
                        }, delay);
                    });
            }

            //Utility functions
            function computeStages() {
                var stages = [];

                art.forEach(function(e) {
                    var st = d3.nest()
                        .key(function(d) { return d.id_step; })
                        .entries(e.steps);
                    st.forEach(function(f) { if (stages.indexOf(f.key) < 0) stages.push(f.key); });
                });

                stages.sort();
                return stages;
            }

            function computeSections() {
                return d3.nest()
                    .key(function(d) {
                        return d.section;
                    })
                    .entries(art)
                    .map(function(d) { return d.key; });
            }

            //compute stages and sections
            var stages = computeStages(),
                columns = stages.length + (currentstep ? 1 : 0),
                sections = computeSections(),
                sectHeight = 15,
                sectJump = 25,
                test_section_details = function (section, etape, field) {
                    return (data.sections && data.sections[section] && data.sections[section][etape] && data.sections[section][etape][field] != undefined);
                },
                get_section_details = function (section, etape, field) {
                    return (test_section_details(section, etape, field) ? data.sections[section][etape][field] : "");
                },
                format_section = function (obj, length) {
                    var sec = (obj.section ? obj.section : obj);
                    if (sec.lastIndexOf("A", 0) === 0)
                        return titre_article(obj, length);
                    if (length < 2 && sec)
                        sec = sub_section(sec);
                    return titre_section(sec, length);
                };

            if (sections.length < 2 && art.length == 1)
                $("#menu-display .dropdown-toggle").addClass('disabled');

            art.forEach(function (d) {
                d.steps.forEach(function (f, j) {
                    f.textDiff = "";
                    f.article = d.titre;
                    f.section = d.section;
                    f.prev_step = null;
                    f.prev_dir = null;
                    f.sect_num = sections.indexOf(f.section);
                    f.step_num = stages.indexOf(f.id_step);
                    if (j != 0 && f.id_step.substr(-5) != "depot") {
                        k = j - 1;
                        while (k > 0 && d.steps[k].status === "echec") k--;
                        f.prev_step = d.steps[k].step_num;
                        f.prev_dir = d.steps[k].directory;
                    }
                    bigList.push(f);
                });
            });

            var to_load = d3.set(bigList.map(function (d) {
                return d.directory;
            })).values().length;

            var maxlen = d3.max(art, function (d) {
                return d3.max(d.steps, function (e) {
                    return e.length;
                })
            });

            //linear mapper for article height
            var lerp = d3.scale.linear().domain([0, 1, maxlen]).range([0, 12, 120]);

            //set color scale for diff
            var levmin = 145, levmax = levmin + 100;
            var diffcolor = d3.scale.linear().range(["rgb(" + [levmax, levmax, levmax].join(',') + ")", "rgb(" + [levmin, levmin, levmin].join(',') + ")"]).domain([0, 1]).interpolate(d3.interpolateHcl);

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
                    div.append("p").html("<small>" + (test_section_details(d.section, d.id_step, 'newnum') ? titre_section(data.sections[d.section][d.id_step]['newnum'], 2) + " (" + format_section(d, 1) + ')' : format_section(d, 2)) + "</small>");
                div.append("p").html("<small>" + titre_etape(d) + "</small>");
                if (d.n_diff == 0) div.append('p').text(d.status == "sup" ? "Supprimé à cette étape" : "Aucune modification");
                else if (d.n_diff == 1 && d.id_step.substr(-5) !== "depot") div.append("p").text((d.prev_step ? "Réintroduit" : "Ajouté") + " à cette étape");
                else if (d.id_step.substr(-5) != "depot") div.append("p").html("Modifications : " + d3.round(d['n_diff'] * 100, 2) + "&nbsp;%");
                div.append("p").html("<small>Longueur du texte : " + d['length'] + " caractères</small>");
                return {
                    title: clean_premier(titre_article(d, 2)),
                    content: div,
                    placement: "mouse",
                    gravity: "bottom",
                    displacement: [-120, 20],
                    mousemove: true
                };
            }

            function section_hover(d, curS) {
                var title,
                    title_details,
                    div = d3.select(document.createElement("div")).style("width", "100%"),
                    curS = curS || d.section;
                div.append("p").html("<small>"+titre_etape(d)+"</small>");
                if (test_section_details(curS, d.id_step, 'title') && curS == "echec") {
                    title = d.status;
                    title_details = get_section_details(curS, d.id_step, 'title');
                } else {
                    if (test_section_details(curS, d.id_step, 'newnum')) {
                        var newnum = get_section_details(curS, d.id_step, 'newnum');
                        title = titre_section(newnum, 2) + " (" + num_sub_section(curS) + ")";
                        title_details = titre_section(newnum.replace(sub_section(newnum), ''), 2) + " (" + format_section(d, 1) + ')';
                    } else {
                        title = titre_section(curS, 2);
                        title_details = titre_parent(curS, 2);
                    }
                    title += (test_section_details(curS, d.id_step, 'title') ? " : " + get_section_details(curS, d.id_step, 'title') : "");
                }
                if (title_details) div.append("p").html("<small>" + title_details + "</small>");
                return {
                    title : clean_premier(title),
                    content : div,
                    placement : "mouse",
                    gravity : "bottom",
                    displacement : [-140, 15],
                    mousemove : true
                };
            }

            var drawArticles = function () {

                var firstmade = false, firstamade = false; // to class the first article which has a rect (for tuto)

                //init coordinates
                prepareSizes();
                setCoordinates();

                maxy = Math.max($("#viz").height(), d3.max(bigList, function (d) {
                        return d.y + lerp(d.length)
                    }) + 50);
                //create SVG
                $("svg").remove();
                svg = d3.select("#viz").append("svg").attr("width", "100%").attr("height", maxy).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                //draw everything
                for (st in stages) {
                    for (se in sections) {

                        var datarts = bigList.filter(function (d) {
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
                                return "article " + d.section.replace(/ |<|\/|>|/g, "") + " sect" + d.step_num;
                            })
                            .classed('article-first', function (d) {
                                if (!firstamade && st > 2 && d.n_diff && d.status != "new") {
                                    firstamade = true;
                                    return true;
                                }
                                return false;
                            })
                            .call(styleRect)
                            .on("click", onclick)
                            .popover(article_hover)
                            .on("mouseenter", function() {
                                $(".popover").addClass("articles-popover");
                            });

                        //Add green labels for new elements
                        group.selectAll(".new")
                            .data(bigList.filter(function (d) {
                                return (d.length > 0 && d.step_num == st && d.sect_num == se && (d.id_step.substr(-5) === "depot" || d.status === "new"))
                            }))
                            .enter().append("rect")
                            .attr("class", "new")
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
                            .on("click", onclick)
                            .popover(article_hover)
                            .on("mouseenter", function() {
                                $(".popover").addClass("articles-popover");
                            });

                        //Add red labels for removed elements
                        group.selectAll(".sup")
                            .data(bigList.filter(function (d) {
                                return (d.length > 0 && d.step_num == st && d.sect_num == se && d.status === "sup")
                            }))
                            .enter().append("rect")
                            .attr("class", "sup")
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
                            .on("click", onclick)
                            .popover(article_hover)
                            .on("mouseenter", function() {
                                $(".popover").addClass("articles-popover");
                            });

                        //Add headers
                        group.selectAll(".header")
                            .data(bigList.filter(function (d) {
                                return (d.step_num == st && d.sect_num == se && d.head)
                            }))
                            .enter().append("rect")
                            .attr("x", function (d) {
                                return d.x
                            })
                            .attr("y", function (d) {
                                return d.y - sectHeight
                            })
                            .classed("header", true)
                            .classed("echec", function(d) { return d.section === 'echec'})
                            .attr("width", colwidth)
                            .attr("height", function (d) {
                                return (d.section === 'echec' ? maxy - 50 : sectHeight);
                            })
                            .style("opacity", function (d) {
                                return section_opacity(d.section)
                            })
                            .popover(function (d) {
                                return (d.section.lastIndexOf("A", 0) === 0 ? article_hover(d) : section_hover(d))
                            })
                            .filter(function (d) {
                                return d.section.lastIndexOf("A", 0) === 0
                            })
                            .on("click", onclick)
                            .on("mouseenter", function() {
                                $(".popover").addClass("articles-popover");
                            });

                        group.selectAll(".header")
                            .filter(function (d) {
                                return d.head > 1
                            })
                            .each(function (d) {
                                var lastS, curS = d.section,
                                    ct = 1;
                                while (ct < d.head) {
                                    ct++;
                                    lastS = sub_section(curS);
                                    curS = d.section.substr(0, curS.length - lastS.length);
                                    group.append("rect")
                                        .attr("x", d.x)
                                        .attr("y", d.y - ct * sectHeight)
                                        .attr("class", "header")
                                        .attr("width", colwidth)
                                        .attr("height", sectHeight)
                                        .style("opacity", section_opacity(curS))
                                        .popover(function () {
                                            return section_hover(d, curS)
                                        })
                                        .on("mouseenter", function() {
                                            $(".popover").addClass("articles-popover");
                                        });
                                }
                            });

                        //Add header labels
                        group.selectAll(".head-lbl")
                            .data(bigList.filter(function (d) {
                                return (d.step_num == st && d.sect_num == se && d.head);
                            }))
                            .enter().append("text")
                            .attr("x", function (d) {
                                return d.x - 2 + colwidth / 2
                            })
                            .attr("y", function (d) {
                                return d.y - (d.section === 'echec' ? 2 : 4)
                            })
                            .classed("head-lbl", true)
                            .classed("echec", function(d) {return d.section === 'echec';})
                            .text(function (d) {
                                if (data.sections && d.section === 'echec') return d.status;
                                var sec;
                                if (d.section.lastIndexOf("A", 0) === 0) sec = d;
                                else sec = sub_section(test_section_details(d.section, d.id_step, 'newnum') ? data.sections[d.section][d.id_step]['newnum'] : d.section);
                                return clean_premier(format_section(sec, longlabel));
                            })
                            .popover(function (d) {
                                return (d.section.lastIndexOf("A", 0) === 0 ? article_hover(d) : section_hover(d))
                            })
                            .on("mouseenter", function() {
                                $(".popover").addClass("articles-popover");
                            })
                            .filter(function (d) {
                                return d.section.lastIndexOf("A", 0) === 0
                            }).on("click", onclick);

                        group.selectAll(".head-lbl")
                            .filter(function (d) {
                                return d.head > 1
                            })
                            .each(function (d) {
                                var lastS, curS = d.section,
                                    ct = 1;
                                while (ct < d.head) {
                                    lastS = sub_section(curS);
                                    curS = d.section.substr(0, curS.length - lastS.length);
                                    group.append("text")
                                        .attr("x", d.x - 2 + colwidth / 2)
                                        .attr("y", d.y - 4 - ct * sectHeight)
                                        .attr("class", "head-lbl")
                                        .popover(function () {
                                            return section_hover(d, curS)
                                        })
                                        .on("mouseenter", function() {
                                            $(".popover").addClass("articles-popover");
                                        })
                                        .text(clean_premier(titre_section(sub_section(curS), longlabel)));
                                    ct++;
                                }
                            });
                    }
                }

                if (!firstamade)
                    d3.select('rect.article').classed("article-first", true);

                //Add connections
                var lines = svg.append("g").selectAll("line").data(bigList.filter(function (d) {
                    a = d3.selectAll(".article").filter(function (e) {
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
                        return bigList.filter(function (e) {
                            return d.article == e.article && d.step_num == e.prev_step
                        })[0].x
                    })
                    .attr("y2", function (d) {
                        var a = bigList.filter(function (e) {
                            return d.article == e.article && d.step_num == e.prev_step
                        })[0];
                        return a.y + (lerp(a.length)) / 2;
                    })
                    .style("stroke", "#d0d0e0")
                    .style("stroke-width", 1);

                //======================
                //Visualization flow ends here
                //======================
                //rect style function
                function styleRect(d) {
                    d.style("stroke", "#d0d0e0")
                        .style("stroke-width", 1)
                        .style("stroke-dasharray", "none")
                        .style("fill", function (f) {
                            return (!f || f.status == 'sup' || f.id_step.substr(-5) === "depot" || f.n_diff == 0 ? '#fff' : diffcolor(f.n_diff));
                        });
                }


                function setCoordinates() {
                    var istage, stagesLen = stages.length;
                    for (istage = 0; istage < stagesLen; ++istage) {
                        var currT = bigList.filter(function (d) {
                                return d.step_num == istage;
                            }),
                            currY = sectJump + sectHeight,
                            piece,
                            lastS = "";

                        var isection, sectionsLen = sections.length;
                        for (isection = 0; isection < sectionsLen; ++isection) {
                            var currS = currT.filter(function (e) {
                                return e.sect_num == isection;
                            })
                                .sort(function (a, b) {
                                    return a.order - b.order;
                                });
                            if (currS.length) {
                                var currIdx;
                                currS.forEach(function (f, k) {
                                    if (k == 0) {
                                        currIdx = k;
                                        currS[currIdx].head = 1;
                                    }
                                    f.y = currY;
                                    f.x = f.step_num * width / columns + 10;
                                    currY += lerp(f.length) + 1
                                });
                                // Identify section jumps
                                var lastsplit = split_section(lastS);
                                var cursplit = split_section(currS[currIdx].section);
                                while (lastsplit.length) {
                                    var newpiece = "";
                                    piece = "";
                                    while (lastsplit.length && !piece) piece = lastsplit.shift();
                                    while (cursplit.length && !newpiece) newpiece = cursplit.shift();
                                    if (newpiece != piece) break;
                                }
                                while (cursplit.length) if (cursplit.shift()) currS[currIdx].head += 1;
                                currY += currS[currIdx].head * sectHeight + sectJump;
                                if (currS[currIdx].head > 1) currS.forEach(function (f) {
                                    f.y += currS[currIdx].head * sectHeight;
                                });
                                lastS = currS[currIdx].section;
                            }
                        }
                    }
                }

                //USE THE ARROWS
                d3.select("body").on("keydown", function () {
                    var c = (d3.select(".curr")),
                        sel, elm;
                    if (articlesScope.tutorial) return;
                    if (c.empty()) return;
                    var cur = c.datum();

                    //LEFT
                    if (d3.event.keyCode == 37) {
                        sel = d3.selectAll(".article").filter(function (e) {
                            return e.article == cur.article && cur.prev_step == e.step_num
                        });
                    }
                    //RIGHT
                    else if (d3.event.keyCode == 39) {
                        sel = d3.selectAll(".article").filter(function (e) {
                            return e.article == cur.article && e.prev_step == cur.step_num
                        });
                    }
                    //UP AND DOWN
                    else if (d3.event.keyCode == 38 || d3.event.keyCode == 40) {
                        d3.event.preventDefault();
                        var curn = $(c.node());

                        //UP
                        if (d3.event.keyCode == 38) {
                            if (curn.prev().length)
                                elm = d3.select(curn.prev().get([0]));
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

                    if (sel && !sel.empty()) sel.each(onclick);
                    else if (elm) {
                        $("#viz").animate({scrollTop: elm.node().getBBox().y - 20}, 200);
                        elm.each(onclick);
                    }
                });


                //functions for aligned layout
                var has_echec = sections.indexOf('echec') >= 0;
                valign = function () {
                    aligned = true;
                    $("#display_menu .chosen").removeClass('chosen');
                    $("#display_menu #dm-aligned").addClass('chosen');
                    $("#menu-display .selectedchoice").text('alignée');
                    var y0 = 0;
                    for (var se = 0; se < sections.length; se++) {
                        if (has_echec && se == 0) continue;
                        var h = 0;
                        var istage, stagesLen = stages.length;
                        for (istage = 0; istage < stagesLen; ++istage) {
                            var a = d3.select(".se" + se + ".st" + istage).node().getBBox();
                            y0 = Math.max(y0, a.y);
                            h = Math.max(h, a.height + 20);
                        }
                        d3.selectAll(".se" + (se))
                            .attr("data-offset", function () {
                                var b = d3.select(this).node().getBBox();
                                return y0 - b.y;
                            });
                        y0 += h;
                    }
                    $("svg").height(Math.max(y0, maxy));

                    d3.selectAll(".group").transition().duration(500)
                        .attr("transform", function () {
                            if ($(this).attr("data-offset")) return "translate(0," + parseFloat($(this).attr('data-offset')) + ")";
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

                            var a = bigList.filter(function (e) {
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
                stacked = function () {
                    aligned = false;
                    $("#display_menu .chosen").removeClass('chosen');
                    $("#display_menu #dm-stacked").addClass('chosen');
                    $("#menu-display .selectedchoice").text('compacte');
                    d3.selectAll(".group").transition().duration(500)
                        .attr("transform", "translate(0,0)");

                    d3.selectAll("line").transition().duration(500)
                        .attr("y1", function (d) {
                            return d.y + (lerp(d.length)) / 2
                        })
                        .attr("y2", function (d) {
                            var a = bigList.filter(function (e) {
                                return e.article === d.article && e.prev_step == d.step_num
                            })[0];
                            return a.y + (lerp(a.length)) / 2;
                        });
                    $("svg").height(maxy);
                };

                //on click behaviour
                function onclick(d) {
                    d3.selectAll("line").style("stroke", "#d0d0e0")
                        .style("stroke-dasharray", "none");
                    //STYLE OF CLICKED ELEMENT AND ROW
                    //Reset rectangles
                    d3.selectAll(".article").call(styleRect);
                    d3.selectAll(".curr").classed("curr", false);

                    d3.select(this).classed("curr", true);

                    //Select the elements in same group
                    d3.selectAll(".article").filter(function (e) {
                        return e && d && e.article == d.article;
                    })
                        .style("stroke", "#333344").style("stroke-width", 1).style("fill", function () {
                            var hsl = d3.rgb(d3.select(this).style("fill")).hsl();
                            hsl.s += 0.1;
                            return hsl.rgb()
                        }).style("stroke-dasharray", [3, 3]);
                    d3.select(this).style("stroke-dasharray", "none");
                    d3.selectAll("line")
                        .filter(function (e) {
                            return e && d && e.article == d.article
                        })
                        .style("stroke", "#333344")
                        .style("stroke-dasharray", [3, 3]);

                    d3.rgb(d3.select(this).style("fill")).darker(2);

                    if (drawing) return;

                    var spin = !d.originalText || (!d.textDiff && d.prev_dir && (d.status == "sup" || d.n_diff) && d.id_step.substr(-5) != "depot");
                    if (spin) thelawfactory.utils.spinner.start('load_art');
                    $(".art-txt").animate({opacity: 0}, 100, function () {
                        $("#readMode").show();
                        $("#text-title").empty();
                        $(".art-meta").empty();
                        $(".art-txt").empty();
                        $("#text-title").html(titre_article(d, 2));
                        var descr = (d.section.lastIndexOf("A", 0) !== 0 ? "<p><b>" + (test_section_details(d.section, d.id_step, 'newnum') ? titre_section(get_section_details(d.section, d.id_step, 'newnum'), 2) + " (" + format_section(d, 1) + ')' : format_section(d, 2)) + "</b>" +
                            (test_section_details(d.section, d.id_step, 'title') ? " : " + get_section_details(d.section, d.id_step, 'title') : "")
                            + "</p>" : "") +
                            "<p><b>" + titre_etape(d) + "</b></p>" +
                            (d.n_diff > 0.05 && d.n_diff != 1 && $(".stb-" + d.directory.substr(0, d.directory.search('_'))).find("a.stb-amds:visible").length ?
                            '<div class="gotomod' + (articlesScope.read ? ' readmode' : '') + '"><a class="button" href="amendements.html?loi=' + loi + '&etape=' + d.directory + '&article=' + d.article + '">Explorer les amendements</a></div>' : '');
                        if (d.n_diff) {
                            if (d.id_step.substr(-5) == "depot")
                                descr += '<p class="comment"><b>Article déposé à cette étape</b></p>';
                            else if (d.status == "new") descr += "<p><b>Article " + (d.prev_step ? "réintroduit" : "ajouté") + " à cette étape</b></p>";
                        } else descr += '<p class="comment"><b>Article ' + (d.status == "sup" ? "supprimé" : "sans modification") + " à cette étape</b></p>";
                        if ((d.n_diff || d.status == "sup") && d.status != "new") $("#revsMode").show();
                        else $("#revsMode").hide();

                        var balise = (d.id_step.substr(-5) != "depot" && d.status == "new" ? 'ins' : 'span');
                        $(".art-meta").html(descr);

                        if (spin) {
                            var waitload = setInterval(function () {
                                if (!to_load) {

                                    if (textArticles[d.article][d.directory] && d.status != "sup") {
                                        d.originalText = '<ul class="originaltext"><li><' + balise + '>' + $.map(textArticles[d.article][d.directory], function (i) {
                                                return i.replace(/\s+([:»;\?!%€])/g, '&nbsp;$1')
                                            }).join("</" + balise + "></li><li><" + balise + ">") + "</" + balise + "></li></ul>";
                                    } else d.originalText = "<p><i>Pour en visionner l'ancienne version, passez en vue différentielle (en cliquant sur l'icone <span class=\"glyphicon glyphicon glyphicon-edit\"></span>) ou consultez la version de cet article à l'étape parlementaire précédente.</i></p>";

                                    if (textArticles[d.article][d.prev_dir]) {
                                        var dmp = new diff_match_patch();
                                        dmp.Diff_Timeout = 5;
                                        dmp.Diff_EditCost = 25;
                                        var preptxt = function (arts, art, dir) {
                                                return arts[art][dir].join("\n").replace(/<[^>]+>/g, '');
                                            },
                                            diff = dmp.diff_main(preptxt(textArticles, d.article, d.prev_dir), preptxt(textArticles, d.article, d.directory));
                                        dmp.diff_cleanupEfficiency(diff);
                                        d.textDiff = '<ul class="textdiff"><li>';
                                        d.textDiff += diff_to_html(diff)
                                            .replace(/\s+([:»;\?!%€])/g, '&nbsp;$1');
                                        d.textDiff += "</li></ul>";
                                    } else d.textDiff += d.originalText;

                                    thelawfactory.utils.spinner.stop(articlesScope.update_revs_view, 'load_art');
                                    clearInterval(waitload);
                                }
                            }, 100);
                        } else {
                            if (!d.textDiff) d.textDiff += d.originalText;
                            articlesScope.update_revs_view();
                        }
                    });
                }

                if (aligned) valign();
                else stacked();
                $('.readMode').tooltip({animated: 'fade', placement: 'bottom', container: 'body'});
                $('.revsMode').tooltip({animated: 'fade', placement: 'bottom', container: 'body'});
            };

            $(document).ready(function () {
                drawArticles();
                $(".art-txt").empty().html(helpText);
                setTimeout(load_texte_articles, 50);
                $(window).resize(function () {
                    if (drawing || $("#view").scope().mod != "articles") return;
                    var selected_art = d3.selectAll(".curr");
                    if (selected_art[0].length) selected_art = selected_art[0][0].id;
                    else selected_art = "";
                    drawing = true;
                    setTimeout(function () {
                        drawArticles();
                        if (selected_art) $("#" + selected_art).d3Click();
                        drawing = false;
                    }, 50);
                });
            });
        }

        return vis;
    };
})();
