var num=0
var participants;
var factions;

function wrap(width) {
  d3.selectAll('text').each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.2, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        dx = parseFloat(text.attr("dx")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").attr("dx",dx).text(word);
      }
    }
  });
}

function highlight(b) {
	console.log(b)
}

function init(data,step) {

	
	var d = data[step]
	var mydata=[]
	factions=data[step].groupes
	
	var groupes=d3.keys(d.groupes);
	participants=d.orateurs
	
	for(e in d.groupes) {
		col = d3.hsl(d.groupes[e].color); if(col.s>0.5) col.s=0.5; col.l=0.75;
		mydata.push({key:e, values:[], color:col, name:d.groupes[e].nom})
		$(".legend").append("<div onclick='highlight(\""+e+"\")' class='leg-item' title='"+d.groupes[e].nom+"'><div class='leg-value' style='background-color:"+col+"'></div><div class='leg-key'>"+e+"</div></div>")
	}
	
	d3.entries(d.divisions).forEach(function(a,b){
		a.value.step = a.key;
	})
	divs=d3.values(d.divisions)
	num = divs.length
	divs.sort(function(b,c){return b.order-c.order}).filter(function(f){return f.total_intervs>0})

	divs.forEach(function(f,j){

		var gp = d3.entries(f.groupes)
		groupes.forEach(function(g,h){
			var filtered = gp.filter(function(k,l){
				
				return k.key.toLowerCase()===g.toLowerCase()
			})
			var curr = mydata.filter(function(e,n){				
					return e.key.toLowerCase()===g.toLowerCase()
				})[0]			
			if(filtered.length) {
				filtered=filtered[0]
				toAdd={label:g,value:filtered.value.nb_mots,step:f.step, name:e.name,speakers:filtered.value.orateurs}
				
				curr.values.push(toAdd)
			}
			else {
				toAdd={label:g,value:1,step:f.step}
				curr.values.push(toAdd)
			}
		})
	})
	
	var w=$("#viz").width();
	var offset = w*20/100;
	var stream = sven.viz.streamkey().data(mydata).target("#viz").height(num*60).width(w).minHeight(1).init()
	d3.selectAll("g:not(.main-g)")
	.attr("transform","translate("+offset+",0) scale("+(w-offset)/w+",1)");
	wrap(offset);

}

sven = {},
sven.viz = {};

sven.viz.streamkey = function(){

	var streamkey = {},
		data,
		width = 600,
		height = 200,
		barWidth = 12,
		barPadding = 5,
		minHeight = 0,
		margin = {top: 30, right: 30, bottom: 30, left: 0},
		mX,
		mY,
		n,
		m,
		target,
		colors = ["#afa", "#669"],
		graphWidth = width - margin.left - margin.right,
		graphHeight = height - margin.top - margin.bottom,
		streamWidth = graphWidth - barWidth;

	streamkey.data = function(x){
		if (!arguments.length) return data;
		data = x;
		return streamkey;
	};

	streamkey.height = function(x){
		if (!arguments.length) return width;
		width = x;
		graphWidth = width - margin.left - margin.right;
		graphHeight = height - margin.top - margin.bottom;
		streamWidth = graphWidth - barWidth;
		return streamkey;
	};	

	streamkey.width = function(x){
		if (!arguments.length) return height;
		height = x;
		graphHeight = height - margin.top - margin.bottom;
		return streamkey;
	};

	streamkey.barWidth = function(x){
		if (!arguments.length) return barWidth;
		barWidth = x;
		streamWidth = graphWidth - barWidth;
		return streamkey;
	};

	streamkey.target = function(x){
		if (!arguments.length) return target;
		target = x;
		return streamkey;
	}

	streamkey.barPadding = function(x){
		if (!arguments.length) return barPadding;
		barPadding = x;
		return streamkey;
	};

	streamkey.margin = function(x){
		if (!arguments.length) return margin;
		margin = x;
		graphWidth = width - margin.left - margin.right;
		graphHeight = height - margin.top - margin.bottom;
		streamWidth = graphWidth - barWidth;
		return streamkey;
	};

	streamkey.minHeight = function(x){
		if (!arguments.length) return minHeight;
		minHeight = x;
		return streamkey;
	};

	streamkey.colors = function(x){
		if (!arguments.length) return colors;
		colors = x;
		return streamkey;
	};

	streamkey.init = function(){
        var steps = [],
        values = [],
        color = d3.scale.linear().range(colors),
        i,
        j;

		n = data.length;
        m = data[0]['values'].length;

		//get values
		data.forEach(function(d,i){
			d['values'].forEach(function(d){if(d['value'] != null){values.push(Math.sqrt(d['value']))}})
		})

		//get steps
		for(j = 0; j < m; ++j){
			steps.push(data[0]['values'][j]['step'])
		}

		//min height scale
		var setMinHeight = d3.scale.linear().domain([d3.min(values),d3.max(values)]);

		
		//sort data, compute baseline and propagate it
		var dataF = layout(sort(data, null),setMinHeight);
		


    	mX = m - 1;
		mY = d3.max(dataF, function(d) {
      		return d3.max(d, function(d) {
        		return d.y0 + d.y;
      			});
   			});


		var x = d3.scale.ordinal()
			.domain(steps)
			.rangePoints([0, streamWidth]);

		var xF = d3.scale.ordinal()
			.domain(steps)
			.range(d3.range(steps.length));

		var y = d3.scale.linear()
    		.domain([0, mY])
    		.range([graphHeight, 0]);

		var svg = d3.select(target).append("svg")
				.attr("width", height)
    			.attr("height", width+50)
    			.append("g")
    			.attr("class","main-g")
    			.attr("transform","translate(0,20)")


		var layer = svg.selectAll("g")
			.data(dataF)
		  .enter().append("g")
			.attr("class", function(d,i){return "layer_"+i})
			.style("fill", function(d, i) {col = d[0].color; if (col.s>0.5) col.s = 0.5; return col.toString(); })
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
			.on("mousemove",function(d){d3.select(".desc").attr("style","top: " + (d3.event.pageY - $(".desc").height() - 15) + "px; left:"+ (d3.event.pageX - $(".desc").width()/2) + "px");})
			d3.select("svg").on("click", function(){ $(".text-container").hide(); d3.select(this).selectAll("rect").transition().style("opacity",0.9); d3.select(this).selectAll("path").transition().attr("fill-opacity",0.3); $(".text-container").empty(); $("#text-title").html("Sélectionner un groupe d'orateurs");})

		var rect = layer.selectAll("rect")
			.data(function(d) { return d; })
		  .enter().append("rect")
			.attr("y", function(d) { return x(d.x); })
			.attr("x", function(d) { return y(d.y0 + d.y); })
			.style("opacity",.9)
			.style("stroke-width",1)
			.style("stroke",function(d){return d.color.darker().toString()})
			.attr("width", function(d) { return y(d.y0) - y(d.y0 + d.y); })
			.attr("height", barWidth)
			.attr("display", "inline")
			.on("click",function(d){
                $(".text-container").show();
				d3.event.stopPropagation();
				svg.selectAll("g").selectAll("path").transition()
				.attr("fill-opacity",0.1);
				svg.selectAll("g").selectAll("rect").transition()
				.style("opacity",0.1)
				d3.select(d3.select(this).node().parentNode).selectAll("path").transition()
				.attr("fill-opacity",0.45);
				d3.select(d3.select(this).node().parentNode).selectAll("rect").transition()
				.style("opacity",0.55);
				d3.select(this).transition().style("opacity",1)
				
				$(".text-container").empty();
				$("#text-title").empty();
				$("#text-title").html(d.label)
				
				spArray= d3.entries(d.speakers).sort(function(a,b){return b.value.nb_mots - a.value.nb_mots})
				
				spArray.forEach(function(g,j){
					var ordiv = document.createElement('div')
					ordiv.className="orateur";
					var div = document.createElement('div')
					div.className="orat-info";
					var siz = $(".text-container").width()*0.25
					if(participants[g.key].photo) $(ordiv).append("<a href='"+participants[g.key].link+"'><img src='"+participants[g.key].photo+"/"+parseInt(siz)+"'/></a>") 
					$(div).append("<p class='orat-name'><b>"+(participants[g.key].photo ? "<a href='"+participants[g.key].link+"'>"+g.key+"</a>" : g.key)+"</b></p>")
					if(participants[g.key].fonction.length) $(div).append("<p class='orat-fonction'>"+participants[g.key].fonction+"</p>")
					$(div).append("<p class='orat-count'>Mots prononcés : "+g.value.nb_mots+"</p>")
					$(div).append("<p><a class='orat-disc' href='"+g.value.link+"'>Lire les interventions</a></p>")
					$(ordiv).append(div)
					$(".text-container").append(ordiv)
					$(".orat-info").width($(".text-container").width()*0.63)
				})
			})
		   .filter(function(d){return d['value'] == null})
			.attr("display", "none");

		var stream = layer.selectAll("path")
			.data(function(d){return areaStreamKey(d, xF)})
			.enter().append("path")
			.attr("d", function(d){return drawLink(d[0], d[1], d[2], d[3])})
			.attr("fill-opacity", 0.3)
			.attr("stroke", "none")
			.attr("display", "inline")
			/*.on("click",function(d){ 
				$(".text-container").empty();
				d3.event.stopPropagation()
				svg.selectAll("g").selectAll("path").transition().attr("fill-opacity",0.1);
				svg.selectAll("g").selectAll("rect").transition().attr("fill-opacity",0.1);
				d3.select(d3.select(this).node().parentNode).selectAll("path").transition().attr("fill-opacity",0.75);
				d3.select(d3.select(this).node().parentNode).selectAll("rect").transition().attr("fill-opacity",1);
				
				$("#text-title").html(d[5])
				
				d3.select(".desc")
				.attr("class","tooltip fade in desc")
				.attr("style","top: " + (d3.event.pageY - $(".desc").height() -15 ) + "px; left:"+ (d3.event.pageX - $(".desc").width()/2 ) + "px")

							 })*/
			.filter(function(d){return d[4] == false})
			.attr("display", "none")
			

				//labels
		var stepsLabel = svg.selectAll("text")
			.data(steps)
		  .enter().append("text")
			.attr("y", function(d) { return x(d) + margin.left; })
			.attr("x", function(d) { return y(mY) + margin.top; })
			.attr("dx", 10)
			.attr("dy", 1)
			.attr("font-family","sans-serif")
			.attr("font-size","0.9em")
      		//.attr("text-anchor", "middle")
      		.attr("class", "filter-title")
      		.attr("fill", "#333")
      		.text(function(d){return d})

		return streamkey;
	};

	function sort(data, sorting){	
		var stepsY = [];

	//from fluxs to steps and sorting
	for (j = 0; j < m; ++j) {
		stepsY[j] = [];

      for (i = 0; i < n; i++){ 
      	stepsY[j].push({'y':data[i]['values'][j]['value'],'value': data[i]['values'][j]['value'], 'index':i, 'x':data[i]['values'][j]['step'],'color':data[i]['color'],'speakers':data[i]['values'][j]['speakers'] ,'category':data[i]['key'], 'label':data[i]['name']})
      }
		console.log(factions)
		var sorted = d3.nest().key(function(d){return d.category}).sortKeys(function(a,b){return factions[b].order - factions[a].order; }).entries(stepsY[j]);
		
		stepsY[j] = []
		sorted.forEach(function(d){d.values.forEach(function(d){stepsY[j].push(d)})})

    }
    		
    		return stepsY;
    };
    
    function layout(data,minHeightScale){

		var sums = [],
        max = 0,
        o,
        dataInit = [],
        y0 = [],
        scaledBarPadding,
        scaledMinHeight;



	// compute baseline (now centered)...
	for (j = 0; j < m; ++j) {
      for (i = 0, o = 0; i < n; i++){ 
      
      	o += data[j][i]['y'];
      	
      
      }
      if (o > max) max = o;
      sums.push(o);
    }
 	
 	
 	scaledBarPadding = barPadding*max/graphHeight;
 	scaledMinHeight = minHeight*(max + scaledBarPadding * n)/graphHeight;
 	
 	minHeightScale.range([minHeightScale.domain()[0] + scaledMinHeight ,minHeightScale.domain()[1] + scaledMinHeight]);
    
    for (j = 0; j < m; ++j) {
      y0[j] = (max - sums[j]) / 2 ;
      }
    
    //...and propagate it to other
	for (j = 0; j < m; ++j) {
		 o = y0[j];
		data[j][0]['y0'] = o;
		data[j][0]['y'] = minHeightScale(data[j][0]['y']);

      for (i = 1; i < n; i++){ 
      
      	if(data[j][i-1]['value'] != null){
      	data[j][i]['y'] = minHeightScale(data[j][i]['y'])
      	}
      	
      	if(data[j][i-1]['value'] != null){
		o += data[j][i-1]['y'] + scaledBarPadding; 
			}
		data[j][i]['y0'] = o;

      }


    }

    //from steps to fluxs
    for (j = 0; j < n; ++j) {
    	dataInit[j] = [];
      for (i = 0; i < m; i++){ 
      	
      	dataInit[j][i] = []
      	
      }
    }
    
    data.forEach(function(d,i){  	
    	d.forEach(function(e,h){  		
    		dataInit[e.index][i] = e;
    		})
	})
	return dataInit;
	}

	function areaStreamKey(data, xScale){

		var steps = [];
		data.forEach(function(d,i){
			if(i < mX){
			var label = d.label
			var vis,
				points = [];
			var p0 = [ graphHeight - (d.y + d.y0 ) * graphHeight / mY ,xScale(d.x)*streamWidth/mX + barWidth]; // upper left point
			var p1 = [ graphHeight - (data[i+1].y + data[i+1].y0) * graphHeight / mY , xScale(data[i+1].x)*streamWidth/mX]; // upper right point
			var p2 = [ graphHeight - (data[i+1].y0 * graphHeight / mY) ,xScale(data[i+1].x)*streamWidth/mX]; // lower right point
			var p3 = [ graphHeight - ((d.y0) * graphHeight / mY),xScale(d.x)*streamWidth/mX + barWidth]; // lower left point
			
			if(d['value'] != null && data[i+1]['value'] != null){
				vis = true;
				}
			else{vis = false};

			points.push(p0,p1,p2,p3,vis, label);
			steps.push(points)
			}	
		})
		return steps;
	};

	function drawLink(p1, p2, p3, p4){
		// clockwise
		// left upper corner
		var p1x = p1[0]
		var p1y = p1[1]
		// right upper corner
		var p2x = p2[0]
		var p2y = p2[1]
		// right lower corner
		var p3x = p3[0]
		var p3y = p3[1]
		// left lower corner
		var p4x = p4[0]
		var p4y = p4[1]
		// medium point
		var m = (p1y + p2y) / 2
		// control points
		

		var outputString = "M" + p4x + "," + p4y	// starting point, i.e. upper left point

					 + "C" + p4x + "," + m		// control point
					 + " " + p3x + "," + m		// control point
					 + " " + p3x + "," + p3y	// reach the end of the step, i.e. upper right point

					 + "L" + p2x + "," + p2y	// reach the lower right point

					 + "C" + p2x + "," + m
					 + " " + p1x + "," + m
					 + " " + p1x + "," + p1y

					 + "Z";		// close area
		return(outputString)
	};

	return streamkey;

	};
