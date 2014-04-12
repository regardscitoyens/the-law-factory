(function() {

	var thelawfactory = window.thelawfactory || (window.thelawfactory = {});

	thelawfactory.mod0 = function() {

		function vis(selection) {
			
			//Initialization
			var ganttcontainer = d3.select("#gantt").append("svg"), 
			currFile, 
			dossiers = [], 
			format = d3.time.format("%Y-%m-%d"), 
			width = parseInt(d3.select("#gantt").style("width"))*15-15, 
			tscale = d3.time.scale().range([0, width]),
			qscale = d3.time.scale().range([10, width]), 
			minstr = "2010-01-05", 
			mindate = format.parse(minstr), 
			today = new Date(), 
			lawh = 50,
			steph= lawh - 16 
			ticks = d3.time.months(mindate, today, 3);


			tscale.domain([mindate, today]);
			qscale.domain([0, today]);
			ganttcontainer.attr("width", width).attr("height", 2900)
			
			
			var defs=ganttcontainer
			  .append('defs')
			  
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
			    .style("opacity",0.7)
			    
			   defs .append('pattern')
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
			    .style("opacity",0.7)
			    
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
			    .style("opacity",0.7)
			

			var grid = ganttcontainer.append("g").attr("class", "grid");
				
				
			selection.each(function(data) {
				
				currFile=data.next_page;
				//Start drawing
				prepareData();
				dynamicLoad();


				function prepareData() {
					data.dossiers.forEach(function(d, i) {
						var st;
						if (d.steps[0].date === "" || d.steps[0].date < d.beginning)
							st = tscale(format.parse(d.beginning))
						else
							st = tscale(format.parse(d.steps[0].date))
						d.xoffset = st;

						d.steps.forEach(function(e,j){

							if (j==0 && (e.date === "" || e < d.beginning)) e.date=d.beginning
							if(e.date && e.date!="" && e.enddate < e.date) e.enddate=e.date
							if(!e.date || e.date==="") e.date=e.enddate
							e.qw=getQwidth(e);

							if(j==0) e.qx=5;
							else {
								e.qx = d.steps[j-1].qx + d.steps[j-1].qw +3;
							}

						})


					})
					dossiers = dossiers.concat(data.dossiers)
					
					//draws current selection
					addLaws();
				}
				
				//function used for multiple data files - progressive loading
				function dynamicLoad() {
					
					d3.json('http://www.lafabriquedelaloi.fr/api/'+currFile,function(error, json){
						
						data=json;
						prepareData();
							
						if (json.next_page) {
							currFile = json.next_page;
							dynamicLoad();
						} else {
							console.log(dossiers)
						}
					})
				}

				function addLaws() {

					//add containing rows
					grid.selectAll(".row")
					.data(dossiers).enter()
					.append("rect")
					.attr("class", "row")
					.attr("x", 0)
					.attr("y", function(d, i) {
						return 2 + i * (20 + lawh)
					})
					.attr("opacity", 0.3)
					.attr("width", width)
					.attr("height", 20 + lawh - 4)
					.style("fill", "#f3efed")

					//add labels
					grid.selectAll(".law-name")
					.data(dossiers).enter()
					.append("text")
					.attr("x", 5)
					.attr("y", function(d, i) {
						return i * (20 + lawh) + 16
					})
					.attr("class", "law-name").text(function(e) {
						return e.short_title
					})
					.attr("font-family", "Helvetica neue")
					.attr("font-size", "12px")
					.style("fill", "#a79b94")

					//add single law group
					var laws = ganttcontainer
					.selectAll(".g-law")
					.data(dossiers).enter()
					.append("g")
					.attr("class", "g-law")
					.attr("transform", function(d, i) {
						return "translate(0," + i * (20 + lawh) + ")"
					}).on("click",function(d){console.log(d)})
					

					//single law background rectangle
					laws.append("rect")
					.attr("x", function(d) {
						return tscale(format.parse(d.beginning))
					})
					.attr("y", 28)
					.attr("width", function(d) {
						return tscale(format.parse(d.end)) - tscale(format.parse(d.beginning))
					})
					.attr("class","law-bg")
					.attr("height", steph)
					.attr("opacity", 0.3).style("fill", "#d8d1c9");

					

					//addsingle law steps
					var steps = laws.append("g")
					.attr("class", "steps")
					.selectAll("step").data(function(d) {
						return d.steps
					})
					.enter()
					.append("g")
					.attr("class","g-step")

					steps.append("rect")
					.attr("class", "step")
					.attr("x", function(e, i) {
						var val = tscale(format.parse(e.date));
						return val
					})
					.attr("y", 28)
					.attr("width", function(e) {
						if (e.stage === "promulgation")
							return 10;
						else {
							if (e.date === "")
								e.date = e.enddate
								//if e.date<
							var val = tscale(format.parse(e.enddate)) - tscale(format.parse(e.date))
							if (val >= 12)
								return val - 2;
							else
								return 10
						}
					})
					.attr("height", steph)
					.style("fill",function(d){
						if(d.institution==="assemblee") return "#ced6dd"
						else if(d.institution==="senat") return "#f99b90"
						else if(d.stage === "promulgation") return "#d50053"
						else return "#aea198"
					})
					.on("click", function(e) {
						console.log(e);
					})
					
					

					//fill pattern
					steps.append("rect")
					.filter(function(e){return e.stage!=="promulgation" && e.nb_amendements >0})
					.attr("class", "step-ptn")
					.attr("x", function(e, i) {
						var val = tscale(format.parse(e.date));
						return val
					})
					.attr("y", 48)
					.attr("width", function(e) {
						if (e.stage === "promulgation") return 10;
						else {
							if (e.date === "") e.date = e.enddate
							var val = tscale(format.parse(e.enddate)) - tscale(format.parse(e.date))
							if (val >= 12) return val - 2;
							else return 10
						}
					})
					.attr("height", steph-20)
					.style("fill",function(d){
						if(d.nb_amendements>=200) return"url(/mod0#diagonal3)"
						else if (d.nb_amendements>=50) return"url(/mod0#diagonal2)"
						else if (d.nb_amendements>=0) return"url(/mod0#diagonal1)"
					})
					

					

					//Step label
					steps
					.append("text")
					.attr("class","step-lbl")
					.attr("x", function(e, i) {
						var val = tscale(format.parse(e.date))+1;
						return val
					})
					.attr("y", 38)
					.text(function(d){return d.institution.substr(0,1).toUpperCase()})
					.style("fill","white")
					.style("font-size",10)
					.style("font-family","open-sans, sans-serif")
					
					
					//update svg height
					ganttcontainer.attr("height", dossiers.length * (20 + lawh))

					//recompute vertical grid to match new height
					d3.selectAll(".tick").remove();
					ticks.forEach(function(e, i) {
						grid.append("line").attr("class", "tick").attr("x1", tscale(e)).attr("y1", 0).attr("x2", tscale(e)).attr("y2", dossiers.length * (20+lawh)).attr("stroke", "#ddd").attr("stroke-width", 1).attr("opacity", 0.6)
					})
				}

				function getQwidth(e) {
					//console.log(e)
					if (e.stage === "promulgation")
							return 10;
						else {
							var diff=format.parse(e.enddate) - format.parse(e.date)
							var day= 1000* 60 * 60 * 24;
							//console.log(e.enddate, e.date, diff/day)
							var val = Math.floor(diff/day)
							if (val>15) return val
							else return 15
						}
				}


				absolutePosition=function() {

					d3.selectAll(".g-law").transition().duration(500).attr("transform", function(d, i) {
						return "translate(" + (-d.xoffset+5) + "," + i * (20 + lawh) + ")"
					})

					d3.selectAll(".step").attr("x", function(e, i) {
						var val = tscale(format.parse(e.date));

						return val
					}).attr("width", function(e) {
						if (e.stage === "promulgation")
							return 10;
						else {
							if (e.date === "")
								e.date = e.enddate
								//if e.date<
							var val = tscale(format.parse(e.enddate)) - tscale(format.parse(e.date))
							if (val >= 12)
								return val - 2;
							else
								return 10
						}
					})
					
					d3.selectAll(".step-lbl")
					.attr("x", function(e, i) {
						var val = tscale(format.parse(e.date))+1;
						return val
					})
					
					d3.selectAll(".law-bg").style("opacity",0.2)
				}

				timePosition=function() {
					d3.selectAll(".g-law").transition().duration(500).attr("transform", function(d, i) {
						return "translate(0," + i * (20 + lawh) + ")"
					})

					d3.selectAll(".step").attr("x", function(e, i) {
						var val = tscale(format.parse(e.date));

						return val
					}).attr("width", function(e) {
						if (e.stage === "promulgation")
							return 10;
						else {
							if (e.date === "")
								e.date = e.enddate
								//if e.date<
							var val = tscale(format.parse(e.enddate)) - tscale(format.parse(e.date))
							if (val >= 12)
								return val - 2;
							else
								return 10
						}
					})
					
					d3.selectAll(".step-lbl")
					.attr("x", function(e, i) {
						var val = tscale(format.parse(e.date))+1;
						return val
					})
					
					
					d3.selectAll(".law-bg").style("opacity",0.2)
				}

				quantiPosition=function() {
					d3.selectAll(".g-law").transition().duration(500).attr("transform", function(d, i) {
						return "translate(0," + i * (20 + lawh) + ")"
					})
					d3.selectAll(".step")
					.attr("x",function(d){return d.qx})
					.attr("width",function(d){if(d.stage==="promulgation") return 15; else return d.qw})
					.style("fill",function(d){
						if(d.institution==="assemblee") return "#ced6dd"
						else if(d.institution==="senat") return "#f99b90"
						else if(d.stage === "promulgation") return "#d50053"
						else return "#aea198"
					})
					
					d3.selectAll(".step-lbl")
					.attr("x",function(d){return d.qx+4})
					
					d3.selectAll(".step-ptn")
					.attr("x",function(d){return d.qx})
					.attr("width",function(d){if(d.stage==="promulgation") return 15; else return d.qw})

					d3.selectAll(".law-bg").transition().duration(500).style("opacity",0)
				}

			});
		};

		return vis;
	};
	
	thelawfactory.mod0_bars = function() {

		function vis(selection) {
			
			var barcontainer=d3.select("#bars")
			var width = parseInt(barcontainer.style("width"))
			//var width = parseInt(barcontainer.style("width"))
			var bscale= d3.scale.linear().range([0,60]);
			
			
			selection.each(function(json) {
				
				json=groupStats(3,json);
			
			
				var vals=d3.values(json)
				var l=vals.length; 
				var m=d3.max(vals)
				bscale.domain([0,m])
			
				console.log(width,l)
				var w=width/l
				
			
				d3.entries(json).forEach(function(e,i){
					var step = barcontainer
					.append("div")
					.attr("class","bar-step")
					.attr("style","width:"+(w*93/100)+"px; margin-right:"+(w*5/100)+"px");
			
					step.append("div")
					.attr("class","bar-value")
					.attr("style","height:"+bscale(e.value)+"px; width:100%; top:"+bscale(m-e.value)+"px");
			
					step.append("div")
					.attr("class","bar-key")
					.text(e.key/30 + " months")
					.attr("style","top:"+(bscale(m-e.value)+5)+"px; font-size:"+d3.min([(w*4/10),12])+"px");
				})
				
				function groupStats(i,data) {
					
					data=d3.entries(data)
					newData={}
					for(var j = 0; j<data.length; j+=i) {
						var key=(j+1)*30+(i-1)*30
						if(j<data.length-2) newData[key]=data[j].value+data[j+1].value+data[j+2].value
						else if (j<data.length-1) newData[key]=data[j].value+data[j+1].value
						else newData[key]=data[j].value;
						
					}
					return newData;

				}
				
			})
			
		}
		return vis;
		
	};
	
})()
