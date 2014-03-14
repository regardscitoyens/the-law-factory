console.log("hi")
var aligned=true;
var valign;
var stacked;

(function() {

	var thelawfactory = window.thelawfactory || (window.thelawfactory = {});

	thelawfactory.mod1 = function() {

        function format_section(s) {
            return s.replace(/^.*([LTCVS]+)(\d+)([\sa-z]*)$/, '$1 $2$3')
                .replace("SS", "Sous-section")
                .replace("S", "Section")
                .replace("C", "Chapitre")
                .replace("L", "Livre")
                .replace("V", "Volume")
                .replace("T", "Tome");
        }

		function vis(selection) {
			selection.each(function(data) {

				var bigList=[]
				var art = d3.values(data.articles);

				art.sort(function(a, b) {
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


				art.forEach(function(d, i) {

					d.steps.forEach(function(f, j) {
						f.textDiff = []
						f.article = d.titre;
						f.section = d.section;


						if (j != 0 && f.id_step.substr(-5) != "depot") {
							for (var l = 1; l <= j; l++) {
								lasttxt = d.steps[j - l].text;
								if (d.steps[j - l].id_step.substr(-5) != "depot")
									break;
							}
							if (!f.text.length)
								lasttxt.forEach(function(g, k) {
									f.textDiff[k] = diffString(g, " ")
								})
							else
								f.text.forEach(function(g, k) {
									if (!lasttxt[k])
										lasttxt[k] = " ";
									f.textDiff[k] = diffString(lasttxt[k], g)
								})
						} else
							f.text.forEach(function(g, k) {
								f.textDiff[k] = diffString(" ", g)
							})
							
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

				//compute stages and sections
				var stages = computeStages()
				var columns = stages.length
				var sections = computeSections()
				var sectJump = 40;
				
				//set color scale for diff
				var levmin = 100, levmax = levmin + 128;
				var diffcolor = d3.scale.linear().range(["rgb(" + [levmax, levmax, levmax].join(',') + ")", "rgb(" + [levmin, levmin, levmin].join(',') + ")"]).domain([0, 1]).interpolate(d3.interpolateHcl);

				//margins
				var margin = {
					top : 0,
					right : 10,
					bottom : 20,
					left : 0
				}, width = $("#viz").width(), height = $(".text-container").height();
				
				
				//init coordinates
				setCoordinates();
				
				
				//create SVG
				var maxy = d3.max(bigList,function(d){return d.y+lerp(d.length)})
				var svg = d3.select("#viz").append("svg").attr("width", "100%").attr("height", Math.max(height, maxy + 100)).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
				
				
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
						.attr("width", width / columns - 20)
						.attr("height", function(d){return lerp(d.length)})
						.call(styleRect)
						.on("click",onclick)
						.popover(function(d) {

							var titre = d.article, section = d.section, status = d['id_step'].replace(/_/g, ", "), length = d['length'];
							var div;

							div = d3.select(document.createElement("div")).style("height", "120px").style("width", "100%")
						    div.append("p").text("Section : " + section)
							div.append("p").text("Étape : " + status)
                            if (d['status'] != "sup") {
							    if (d['n_diff'] == 0)
                                    div.append("p").text("Non modifié")
                                else div.append("p").text("Modifications : " + d3.round(d['n_diff'] * 100, 2) + " %")
								div.append("p").text("Longueur du texte : " + length + " caractères")
							} else
                                div.append("p").text("Supprimé à cette étape")
							return {
								title : "Article " + titre,
								content : div,
								placement : "mouse",
								gravity : "right",
								displacement : [10, -85],
								mousemove : true
							};
						});

						//Add green labels for new elements
						group.selectAll(".new")
						.data(bigList.filter(function(d){return (d.length > 0 && d.step_num==st && d.sect_num==se && d.status==="new")}))
						.enter().append("rect")
						.attr("class", "new")
						.style("stroke", "none")
						.style("fill", '#8DF798')
						.attr("y", function(d){return d.y + 2})
						.attr("x", function(d){return d.x + 1})
						.attr("height", function(d){return lerp(d.length) - 3})
						.attr("width", 6)

						//Add red labels for removed elements
						group.selectAll(".sup")
						.data(bigList.filter(function(d){return (d.length > 0 && d.step_num==st && d.sect_num==se && d.status==="sup")}))
						.enter().append("rect")
						.attr("class", "sup")
						.style("stroke", "none")
						.style("fill", '#FD5252')
						.attr("y", function(d){return d.y + 2})
						.attr("x", function(d){return d.x + 1})
						.attr("height", function(d){return lerp(d.length) - 3})
						.attr("width", 6)


						//Add headers
						group.selectAll(".header")
						.data(bigList.filter(function(d){return (d.step_num==st && d.sect_num==se && d.head && d.section!="none")}))
						.enter().append("rect")
						.attr("x", function(d){return d.x})
						.attr("y", function(d){return d.y-15})
						.attr("class","header")
						.attr("width", width / columns - 20)
						.attr("height", 15)
						.style("fill", "#2553C2")
						.style("stroke", "none")
						.style("opacity", function(d){return 1.25-0.3*d.section.match(/[LCVTS]+\d+/g).length})
						.style("stroke-width", "1px")

						//Add header labels
						group.selectAll(".head-lbl")
						.data(bigList.filter(function(d){return (d.step_num==st && d.sect_num==se && d.head)}))
						.enter().append("text")
						.attr("x", function(d){return d.x + 5})
						.attr("y", function(d){return d.y - 4})
						.attr("class", "head-lbl")
						.attr("font-family", "sans-serif")
						.attr("font-size", "9px")
						.attr("font-weight", "bold")
						.style("fill", "#ffffff")
						.text(function(d){return format_section(d.section)});
					}
				}

				//Add connections
				var lines = svg.append("g").selectAll("line").data(bigList.filter(function(d) {
					a = d3.selectAll(".article").filter(function(e){return d.article == e.article && d.step_num == e.step_num-1})
					return !a.empty() && d.status!=="sup" && d.step_num+1<stages.length;
				})).enter();

				lines.append("line")
				.attr("x1", function(d){return d.x + width / columns - 20})
				.attr("y1", function(d) {return d.y + (lerp(d.length)) / 2})
				.attr("x2", function(d){
					var a=bigList.filter(function(e){return e.article===d.article && e.step_num==d.step_num+1 })[0]
					return a.x;
				})
				.attr("y2", function(d){
					var a=bigList.filter(function(e){return e.article===d.article && e.step_num==d.step_num+1 })[0]
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
					.style("stroke", function(d) {
						return "#d0d0e0";
						//return d3.hcl(diffcolor(d.n_diff)).darker();
					})
					.style("stroke-width", 1).style("stroke-dasharray", "none").style("fill", function(d) {
						if (d.status == 'sup')
							return '#fff';
						else 
							return diffcolor(d.n_diff);
					});
				}
				
				//Utility functions
				function findStage(s) {

					for (st in stages) {
						if (encodeURI(s) == encodeURI(stages[st]).substring(3)) {
							return parseInt(st)
						}
					}
					return -1
				}


				function computeStages() {

					stag = []

					art.forEach(function(e, i) {
						var st = d3.nest().key(function(d) {
							return d.id_step;
						})
						//.entries(e.steps)
						.map(e.steps, d3.map);

						d3.keys(st).forEach(function(f, i) {

							if (stag.indexOf(f) < 0) {
								stag.push(f)
							}
						})
					})
					stag.sort()

					for (s in stag) {
						//console.log(stag[s])
						stag_name = stag[s].split("_", 4).splice(2, 3).join(" ");
						//console.log(stag_name);
						//$(".stages").append('<div class="stage" style="width:' + 100 / stag.length + '%">' + stag_name + '</div>')
					}

					return stag
				}

				function computeSections() {
					var se = d3.nest().key(function(d) {
						return d.section;
					})
					.map(art, d3.map);
					return se.keys()
				}

				function findSection(s) {
					res = sections.indexOf(s);
					return res
				}

				function setCoordinates() {
					bigList.forEach(function(d,i){
						d.sect_num=findSection(d.section)
						d.step_num=findStage(d.id_step)
					})

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
					if (d3.select(".curr").empty()) {
						//console.log("no one selected")
						d3.select(".article").each(onclick);
					} else {
						c = (d3.select(".curr"))
						cur = c.datum();

						//LEFT
						if (d3.event.keyCode == 37) {
							var sel = d3.selectAll(".article").filter(function(e){return e.article == cur.article && e.step_num==cur.step_num-1})
							if(!sel.empty()) {console.log(sel); sel.each(onclick);}
						}
						//RIGHT
						else if (d3.event.keyCode == 39) {
							var sel = d3.selectAll(".article").filter(function(e){return e.article == cur.article && e.step_num==cur.step_num+1})
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
							if (d3.event.keyCode == 38) {
								curn=$(c.node())
								if(curn.prev().length) {
									d3.select(curn.prev().get([0])).each(onclick)
								}
								else {
									var a = $(".group.st"+cur.step_num+":lt("+cur.sect_num+"):parent:last")
									if(a.length) {
										console.log(a.children(),a.children("rect").last())
										d3.select(a.children(".article").last().get([0])).each(onclick)
									}
								}
								
							}
							
							//DOWN
							else if(d3.event.keyCode == 40) {
								
								curn=$(c.node())
								if(curn.next().length && d3.select(curn.next().get([0])).classed("article")) {
									d3.select(curn.next().get([0])).each(onclick)
								}
								
								else {
									var a = $(".group.st"+cur.step_num+":gt("+cur.sect_num+"):parent")
									if(a.length) {
										d3.select(a.children().get([0])).each(onclick)
									}
									
								}
							}
							d3.select(el).each(onclick);
						}

					}
				});
				
				
				//functions for aligned layout
				valign = function() {

					for(var se=0; se<sections.length-1; se++) {
						var ma=0;
						var mx=0;
						for(st in stages) {
							a=d3.select(".se"+se+".st"+st).node().getBBox();
							if(se==6) console.log("ci siamo",".se"+se+".st"+st, a, a.y+a.height )
							if(a.y+a.height>=ma) ma=a.y+a.height;
						}
						if(se==6) console.log("ma",ma)
						mx+=ma+30
						d3.selectAll(".se"+(se+1))
						//.transition().duration(500)
						.attr("data-offset", function(d){
							var b=d3.select(this).node().getBBox();
							return mx-b.y;
						})
					}

					d3.selectAll(".group")
					.transition().duration(500)
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
						
						var a=bigList.filter(function(e){return e.article===d.article && e.step_num==d.step_num+1 })[0]
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
							var a=bigList.filter(function(e){return e.article===d.article && e.step_num==d.step_num+1 })[0]
							return a.y + (lerp(a.length)) / 2;
						})
					}
				
				//on click behaviour
				function onclick(d) {
					console.log(d)
					d3.selectAll("line").style("stroke", "#d0d0e0");

					//STYLE OF CLICKED ELEMENT AND ROW
					//Reset rectangles
					d3.selectAll(".article").call(styleRect);
					d3.selectAll(".curr").classed("curr", false);
					d3.select(this).classed("curr", true);
					//Select the elements in same group
					//datum = d3.select(this.parentNode)

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

					
					var titre = d.article, section = d.section, status = d['id_step'].replace(/_/g, ", "), length = d['length'];
					$(".art-meta").html(
                        (section !== 'none' ? "<p><b>Section :</b> " + section + "</p>" : "") +
                        "<p><b>Étape :</b> " + status + "</p>" + 
                        (d['status'] == "sup" ? "<p><b>Supprimé à cette étape.</b></p>" : "") +
                        "<p><b>Alinéas :</b></p>"
                    )
					$("#text-title").text("Article " + d.article);
					$(".art-txt").html("<ul><li><span>" + $.map(d.textDiff, function(i) {
						return i.replace(/\s+([:»;\?!%€])/g, '&nbsp;$1')
					}).join("</span></li><li><span>") + "</span></li></ul>")
				}
				
				$(document).ready(function() {
					var s = $(".text");
					var pos = s.offset();
					var w = s.width();
					//console.log("pos",pos)
					$(window).scroll(function() {
						var windowpos = $(window).scrollTop();
						if (windowpos >= pos.top) {
							s.addClass("stick");
							s.css("left", pos.left);
							s.css("width", w);
						} else {
							s.removeClass("stick");
							s.css("left", "");
							s.css("width", "18.33%");
						}
					});
				});

				
		});
	};
	return vis;
};
})();
