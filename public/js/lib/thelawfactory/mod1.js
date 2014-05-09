var aligned = true;
var valign;
var stacked;

(function() {

	var thelawfactory = window.thelawfactory || (window.thelawfactory = {});

	thelawfactory.mod1 = function() {

        function titre_etape(article) {
            return article['id_step'].split('_').slice(1,4).join(' ⋅ ')
                .replace(/(\d)([eéè][rm]e?)/, '$1<sup>$2</sup> ')
                .replace('nouv.lect.', 'nouvelle lecture')
                .replace('l.définitive', 'lecture définitive')
                .replace('senat', 'Sénat')
                .replace('assemblee', 'AN')
                .replace('CMP ⋅ CMP', 'CMP')
                .replace('hemicycle', 'hémicycle')
                .replace('depot', 'dépôt');
        }

        function clean_premier(s) {
            return s.replace('<sup>er</sup>', '');
        }

        function titre_section(s, short_labels) {
            if (!s) return s;
            var res = "",
                s = s.split(/([LTCVS]+\d+[\sa-z]*)/);
            for (var i in s) if (s[i]) {
                res += (res ? " ⋅ " : "");
                res += s[i].replace(/([LTCVS]+)(\d+e?r?)\s*([\sa-z]*)/, '$1 $2 $3')
                    .replace(/(\d)er?/g, '$1<sup>er</sup>')
                    .replace("SS", (short_labels ? "S-Sec." : "Sous-section"))
                    .replace("S", (short_labels ? "Sect." : "Section"))
                    .replace("C", (short_labels ? "Chap." : "Chapitre"))
                    .replace("L", "Livre")
                    .replace("V", (short_labels ? "Vol." : "Volume"))
                    .replace("T", "Titre");
            }
            return res;
        }

        function titre_article(article, short_labels) {
            var num = (article.newnum != undefined ? article.newnum : article.article);
            if (short_labels) return "A." + num.replace(/(\d)er?/, '$1');
            return ("Article ") + num +
                (article.newnum != undefined ? " (" + article.article + ")" : "")
                .replace(/(\d)er?/, '$1<sup>er</sup>');
        }

        function format_section(obj, length) {
            if (obj.section && obj.section.lastIndexOf("A", 0) === 0)
                return titre_article(obj, (!length));
            var res = (obj.section ? obj.section : obj.newnum);
            if (length < 2 && res)
                res = res.replace(/^.*([LTCVS]+\d+[\sa-z]*)$/, '$1');
            return titre_section(res, (!length));
        }

        function section_opacity(s) {
            if (s === "echec") return 0.35;
            if (s.lastIndexOf("A", 0) === 0)
                return 0.65;
            return 1.25-0.3*s.match(/[LCVTS]+\d+/g).length;
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
            html.push('<'+typ+'>'+text.replace(/\n/g, '</'+typ+'></li><li><'+typ+'>')+'</'+typ+'>');
          }
          return html.join('');
        };

		function vis(selection) {
			selection.each(function(data) {

                var re= /l\=(.*)/;
                var id= location.search.match(re)[1];

				var bigList=[]
				var art = d3.values(data.articles);

				art.sort(function(a, b) {
                    if (a.section === "echec") return (b.section === "echec" ? 0 : -1);
                    else if (b.section === "echec") return 1;
					var al = a.titre.split(" "), bl = b.titre.split(" ")
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


				//compute stages and sections
				var stages = computeStages()
				var columns = stages.length
				var sections = computeSections()
				var sectJump = 40;

				art.forEach(function(d, i) {

					d.steps.forEach(function(f, j) {
						f.textDiff = "";
						f.article = d.titre;
						f.section = d.section;
                        f.prev_step = null;
						f.sect_num=findSection(f.section)
					    f.step_num=findStage(f.id_step)
                        if (j != 0 && f.id_step.substr(-5) != "depot") {
                            k = j-1;
                            while (k > 0 && d.steps[k].status === "echec") k--;
                            f.prev_step = d.steps[k].step_num;
                        } else {
                            f.textDiff += "<ul><li><span>" + $.map(f.text, function(i) {
                                    return i.replace(/\s+([:»;\?!%€])/g, '&nbsp;$1')
                                }).join("</span></li><li><span>") + "</span></li></ul>";
                        }
						bigList.push(f);
					});
				})

				var maxlen = d3.max(art, function(d) {
					return d3.max(d.steps, function(e) {
						return e.length;
					})
				});

				//linear mapper for article height
				var lerp = d3.scale.linear().domain([0, 1, maxlen]).range([0, 12, 120]);

				//set color scale for diff
				var levmin = 145, levmax = levmin + 100;
				var diffcolor = d3.scale.linear().range(["rgb(" + [levmax, levmax, levmax].join(',') + ")", "rgb(" + [levmin, levmin, levmin].join(',') + ")"]).domain([0, 1]).interpolate(d3.interpolateHcl);

				//margins
				var margin = {
					top : 0,
					right : 10,
					bottom : 20,
					left : 0
				}, width = $("#viz").width();

				//init coordinates
				setCoordinates();

				//create SVG
				var maxy = Math.max(d3.max(bigList,function(d){return d.y+lerp(d.length)}) + 50, $(".text-container").height())
				var svg = d3.select("#viz").append("svg").attr("width", "100%").attr("height", maxy).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                function article_hover(d) {
                    var div = d3.select(document.createElement("div")).style("width", "100%");
                    if (d.section.lastIndexOf("A", 0) !== 0)
                      div.append("p").html("<small>"+(data.sections[d.section][d.id_step] && data.sections[d.section][d.id_step].newnum != undefined ? format_section(data.sections[d.section][d.id_step], 2) + " ("+format_section(d, 0)+')' : format_section(d, 2))+"</small>");
                    div.append("p").html("<small>"+titre_etape(d)+"</small>");
                    if (d['status'] != "sup") {
                        if (d['n_diff'] == 0) div.append("p").text("Non modifié")
                        else if (d.status != "new" && d.id_step.substr(-5) != "depot") div.append("p").html("<small>Modifications : " + d3.round(d['n_diff'] * 100, 2) + " %</small>")
                        div.append("p").html("<small>Longueur du texte : " + d['length'] + " caractères</small>")
                    } else div.append("p").text("Supprimé à cette étape");
                    return {
                        title : clean_premier(titre_article(d, false)),
                        content : div,
                        placement : "mouse",
                        gravity : "right",
                        displacement : [10, -85],
                        mousemove : true
                    };
				}

                function section_hover(d) {
                    var div = d3.select(document.createElement("div")).style("width", "100%");
                    div.append("p").html("<small>"+titre_etape(d)+"</small>");
                    if (data.sections && d.section == "echec") div.append("p").html(data.sections[d.section][d.id_step].title);
                    else div.append("p").html("<small>"+(data.sections && data.sections[d.section][d.id_step] && data.sections[d.section][d.id_step].newnum != undefined ? titre_section(data.sections[d.section][d.id_step].newnum, false)+" ("+format_section(d, 0)+')' : titre_section(d.section, false))+"</small>");
                    return {
                        title : (data.sections && d.section == "echec" ? d.status : clean_premier(format_section((data.sections && data.sections[d.section][d.id_step] && data.sections[d.section][d.id_step].newnum != undefined ? data.sections[d.section][d.id_step] : d), 1)) + (data.sections && data.sections[d.section][d.id_step] ? " : " + data.sections[d.section][d.id_step].title : "")),
                        content : div,
                        placement : "mouse",
                        gravity : "right",
                        displacement : [10, -85],
                        mousemove : true
                    };
				}

				//draw everything
				for(st in stages) {
					for (se in sections) {
						var group = svg.append("g").attr("class","group se"+se+" st"+st)

						//Add articles
						group.selectAll(".article")
						.data(bigList.filter(function(d){return (d.length > 0 && d.step_num==st && d.sect_num==se)}))
						.enter().append("rect")
						.attr("x", function(d){return d.x})
						.attr("y", function(d){return d.y})
						.attr("class","article")
						.attr("width", width / columns - 30)
						.attr("height", function(d){return lerp(d.length)})
						.call(styleRect)
						.on("click",onclick)
						.popover(article_hover);

						//Add green labels for new elements
						group.selectAll(".new")
						.data(bigList.filter(function(d){return (d.length > 0 && d.step_num==st && d.sect_num==se && (d.id_step.substr(-5) === "depot" || d.status==="new"))}))
						.enter().append("rect")
						.attr("class", "new")
						.style("stroke", "none")
						.style("fill", '#8DF798')
						.attr("y", function(d){return d.y + 1})
						.attr("x", function(d){return d.x + 1})
						.attr("height", function(d){return lerp(d.length) - 2})
						.attr("width", 6)
						.on("click",onclick)
						.popover(article_hover);

						//Add red labels for removed elements
						group.selectAll(".sup")
						.data(bigList.filter(function(d){return (d.length > 0 && d.step_num==st && d.sect_num==se && d.status==="sup")}))
						.enter().append("rect")
						.attr("class", "sup")
						.style("stroke", "none")
						.style("fill", '#FD5252')
						.attr("y", function(d){return d.y + 1})
						.attr("x", function(d){return d.x + 1})
						.attr("height", function(d){return lerp(d.length) - 2})
						.attr("width", 6)
						.on("click",onclick)
						.popover(article_hover);

						//Add headers
						group.selectAll(".header")
						.data(bigList.filter(function(d){return (d.step_num==st && d.sect_num==se && d.head)}))
						.enter().append("rect")
						.attr("x", function(d){return d.x})
						.attr("y", function(d){return d.y-15})
						.attr("class","header")
						.attr("width", width / columns - 30)
						.attr("height", function(d){return (d.section === 'echec' ? maxy-50 : 15)})
						.style("fill", function(d){return (d.section === 'echec' ? "#FD5252" : "#2553C2")})
						.style("stroke", "none")
						.style("opacity", function(d){return section_opacity(d.section)})
						.style("stroke-width", "1px")
						.popover(function(d){return (d.section.lastIndexOf("A", 0) === 0 ? article_hover(d) : section_hover(d))})
                        .filter(function(d){return d.section.lastIndexOf("A", 0) === 0}).on("click", onclick);

						//Add header labels
						group.selectAll(".head-lbl")
						.data(bigList.filter(function(d){return (d.step_num==st && d.sect_num==se && d.head)}))
						.enter().append("text")
						.attr("x", function(d){return d.x + width / columns / 2 - 17})
						.attr("y", function(d){return d.y - (d.section === 'echec' ? 2 : 4)})
						.attr("class", "head-lbl")
						.attr("font-family", "sans-serif")
						.attr("text-anchor", "middle")
						.attr("letter-spacing", "0.2em")
						.attr("font-size", function(d){return (d.section === 'echec' ? '10px' : '9px')})
						.attr("font-weight", "bold")
						.style("fill", 'white')
						.text(function(d){return (d.section === 'echec' ? d.status : clean_premier(format_section(data.sections && data.sections[d.section] && data.sections[d.section][d.id_step] && data.sections[d.section][d.id_step].newnum != undefined ? data.sections[d.section][d.id_step] : d, (width < 120 * columns ? 0 : 1))))})
						.popover(function(d){return (d.section.lastIndexOf("A", 0) === 0 ? article_hover(d) : section_hover(d))})
                        .filter(function(d){return d.section.lastIndexOf("A", 0) === 0}).on("click", onclick);
					}
				}

				//Add connections
				var lines = svg.append("g").selectAll("line").data(bigList.filter(function(d) {
					a = d3.selectAll(".article").filter(function(e){
                        return (d.article == e.article && d.step_num == e.prev_step)
                    })
					return !a.empty() && d.status != "sup";
				})).enter();

				lines.append("line")
				.attr("x1", function(d){return d.x + width / columns - 30})
				.attr("y1", function(d){return d.y + (lerp(d.length)) / 2})
				.attr("x2", function(d){return bigList.filter(function(e){return d.article == e.article && d.step_num==e.prev_step})[0].x})
				.attr("y2", function(d){
					var a=bigList.filter(function(e){return d.article == e.article && d.step_num==e.prev_step})[0];
					return a.y + (lerp(a.length)) / 2;
				})
				.style("stroke", "#d0d0e0")
				.style("stroke-width", 1);

				//======================
				//Visualization flow ends here
				//======================

				//rect style function
				function styleRect(d){
					d.attr("class", function(d) {
						return "article " + d.section.replace(/ |<|\/|>|/g,"") + " sect" + findStage(d.id_step)
					})
					.style("stroke","#d0d0e0")
					.style("stroke-width", 1).style("stroke-dasharray", "none").style("fill", function(d) {
						return (d.status == 'sup' || d.id_step.substr(-5) === "depot" || d.n_diff == 0 ? '#fff' : diffcolor(d.n_diff));
					});
				}

				//Utility functions
				function findStage(s) {
					for (st in stages)
						if (encodeURI(s) == encodeURI(stages[st]).substring(3))
							return parseInt(st);
					return -1;
				}


				function computeStages() {
					stag = []
					art.forEach(function(e, i) {
						var st = d3.nest().key(function(d) { return d.id_step; }).map(e.steps, d3.map);
						d3.keys(st).forEach(function(f, i) { if (stag.indexOf(f) < 0) stag.push(f); });
					});
					stag.sort();
					for (s in stag)
						stag_name = stag[s].split("_", 4).splice(2, 3).join(" ");
					return stag;
				}

				function computeSections() {
					var se = d3.nest().key(function(d) {
                        return d.section;
					})
				    .map(art, d3.map);
					return se.keys();
				}

				function findSection(s) {
					res = sections.indexOf(s);
					return res
				}

				function setCoordinates() {
					for (t in stages) {
						currT=bigList.filter(function(d){return d.step_num==t})
						currY=sectJump;
						for (s in sections) {
							currS=currT.filter(function(e){return e.sect_num==s})
							if(currS.length) {
								currS.sort(function(a,b){return a.order - b.order})
								currS.forEach(function(f,k){
									if (k==0) f.head=true;
									f.y = currY;
									f.x = f.step_num * width / columns + 10;
									currY+=lerp(f.length)+1
								})
								currY+=sectJump;
							}
						}
					}
				}

				//USE THE ARROWS
				d3.select("body").on("keydown", function() {
					/*if (d3.select(".curr").empty()) {
						d3.select(".article").each(onclick);
					} else {*/

						c = (d3.select(".curr"))
						cur = c.datum();

						//LEFT
						if (d3.event.keyCode == 37) {
							var sel = d3.selectAll(".article").filter(function(e){return e.article == cur.article && cur.prev_step==e.step_num})
							if(!sel.empty()) {sel.each(onclick);}
						}
						//RIGHT
						else if (d3.event.keyCode == 39) {
							var sel = d3.selectAll(".article").filter(function(e){return e.article == cur.article && e.prev_step==cur.step_num})
							if(!sel.empty()) sel.each(onclick);
						}
						//UP AND DOWN
						else if (d3.event.keyCode == 38 || d3.event.keyCode == 40) {

							d3.event.preventDefault();

							var g = $(".curr").parent()

							found = false;
							end = false;
							el = null;

							//UP

                            var elm;

							if (d3.event.keyCode == 38) {
								curn=$(c.node())
								if(curn.prev().length) {
                                    elm = d3.select(curn.prev().get([0]))
                                    elm.each(onclick)

								}
								else {
									var a = $(".group.st"+cur.step_num+":lt("+cur.sect_num+"):parent:last")
									if(a.length) {
                                       elm = d3.select(a.children(".article").last().get([0]))
                                       elm.each(onclick)

									}
								}

							}

							//DOWN
							else if(d3.event.keyCode == 40) {

								curn=$(c.node())
								if(curn.next().length && d3.select(curn.next().get([0])).classed("article")) {
									elm = d3.select(curn.next().get([0]))
                                    elm.each(onclick)

								}

								else {
									var a = $(".group.st"+cur.step_num+":gt("+cur.sect_num+"):parent")
									if(a.length) {
                                        elm = d3.select(a.children().get([0]))
                                            elm.each(onclick)

									}

								}
							}
							//d3.select(el).each(onclick);
                            $("#viz").animate({ scrollTop: elm.node().getBBox().y -20 });

						}


				});


				//functions for aligned layout
                var has_echec = sections.indexOf('echec') >= 0;
				valign = function() {
                    var y0 = 0;
					for(var se=0; se<sections.length; se++) {
                        if (has_echec && se == 0) continue;
                        var h = 0;
                        for (st in stages) {
                            a=d3.select(".se"+se+".st"+st).node().getBBox();
                            y0 = Math.max(y0, a.y);
                            h = Math.max(h, a.height+20);
						}
						d3.selectAll(".se"+(se))
						.attr("data-offset", function(d){
							var b=d3.select(this).node().getBBox();
							return y0-b.y;
                        })
                        y0 += h;
					}

					d3.selectAll(".group").transition().duration(500)
					.attr("transform",function(d){
						if($(this).attr("data-offset")) return "translate(0,"+parseFloat($(this).attr('data-offset'))+")"
						else return "translate(0,0)";
					})

					valignLines();
				}

				function valignLines() {
					d3.selectAll("line").transition().duration(500)
					//.style("opacity","1")
					.attr("y1",function(d){
						if(!d.hs) {
							var hs = $("g.se"+d.sect_num+".st"+d.step_num).attr("data-offset")
							if(!hs) hs=0;
							d.hs=parseFloat(hs)
						}
						return d.hs + d.y + (lerp(d.length)) / 2
					})
					.attr("y2", function(d){

						var a=bigList.filter(function(e){return e.article===d.article && e.prev_step==d.step_num})[0]
						if(!a.he) {
							var he = $("g.se"+a.sect_num+".st"+a.step_num).attr("data-offset")
							if(!he) he=0;
							a.he=parseFloat(he)
						}
					return a.he + a.y + (lerp(a.length)) / 2;
				})
				}


				//function for stacked layout
				stacked = function() {
					d3.selectAll(".group").transition().duration(500)
					.attr("transform","translate(0,0)")

					d3.selectAll("line").transition().duration(500)
						.attr("y1", function(d) {return d.y + (lerp(d.length)) / 2})
						.attr("y2", function(d){
							var a=bigList.filter(function(e){return e.article===d.article && e.prev_step==d.step_num})[0]
							return a.y + (lerp(a.length)) / 2;
						})
					}

				//on click behaviour
				function onclick(d) {
                    $(".text-container").show();
					d3.selectAll("line").style("stroke", "#d0d0e0");

					//STYLE OF CLICKED ELEMENT AND ROW
					//Reset rectangles
					d3.selectAll(".article").call(styleRect);
					d3.selectAll(".curr").classed("curr", false);
					d3.select(this).classed("curr", true);

					//Select the elements in same group
					d3.selectAll(".article").filter(function(e){return e.article==d.article})
					.style("stroke", "#D80053").style("stroke-width", 1).style("fill", function(d) {
						hsl = d3.rgb(d3.select(this).style("fill")).hsl()
						hsl.s += 0.1;
						return hsl.rgb()
					})

					d3.selectAll("line")
					.filter(function(e){return e.article==d.article})
					.style("stroke", "#D80053");

					d3.rgb(d3.select(this).style("fill")).darker(2)
					d3.select(this).style("stroke-dasharray", [3, 3])
					$(".art-meta").html(
                        (d.section.lastIndexOf("A", 0) !== 0 ? "<p><b>Section :</b> " + format_section(d, 2) + "</p>" : "") +
                        "<p><b>Étape :</b> " + titre_etape(d) + "</p>" +
                        (d['status'] == "sup" ? "<p><b>Supprimé à cette étape.</b></p>" : "") +
                        (d.n_diff && d.status !== "new" && $(".stb-"+d.directory).find("a.stb-amds:visible").length ? '<p><a href="mod2?l='+id+'&s='+ d.directory+'&a=article_'+ d.article.toLowerCase().replace(/ |'/g, '_')+'">Explorer les amendements</a></p>' : '') +
                        "<p><b>Alinéas :</b></p>"
                    )
					$("#text-title").html(titre_article(d));
                    if (!d.textDiff) {
                        var lasttxt=bigList.filter(function(e){return e.article===d.article && e.prev_step==d.step_num})[0].text;
                        setTimeout(function() {
                            var dmp = new diff_match_patch();
                            dmp.Diff_Timeout = 1;
                            dmp.Diff_EditCost = 25;
                            var diff = dmp.diff_main(lasttxt.join("\n"), d.text.join("\n"));
                            dmp.diff_cleanupEfficiency(diff);
                            d.textDiff = "<ul><li>";
                            d.textDiff += diff_to_html(diff)
                                .replace(/\s+([:»;\?!%€])/g, '&nbsp;$1');
                            d.textDiff += "</li></ul>";
                            $(".art-txt").html(d.textDiff);
                        }, 0);
                    } else $(".art-txt").html(d.textDiff);
				}

				$(document).ready(function() {
                    if (aligned) valign();
                    else stacked();
				});

		});
	};
	return vis;
};
})();
