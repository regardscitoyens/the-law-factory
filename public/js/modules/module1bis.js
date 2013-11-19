var artHeight=0.01;
var art_values=d3.values(dat.articles)
art_values.sort(function(a, b) {
	al=a.titre.split(" ")
	bl=b.titre.split(" ")
	if (parseInt(al[0]) != parseInt(bl[0])) return parseInt(al[0]) - parseInt(bl[0])
	else if(al.length>0) return 1
    else return al[1] - b[1];
});

var stages=computeStages()
var columns=stages.length
var sections=computeSections()
var maxy=0;
console.log("stages",stages)
console.log("sections", sections)
setCoordinates();

var margin = {
	top : 10,
	right : 10,
	bottom : 20,
	left : 0
}, width = $("#viz").width(), height = 800 - margin.top - margin.bottom;


var svg = d3.select("#viz").append("svg").attr("width", "100%" ).attr("height", maxy+200).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var layer = svg.selectAll(".layer").data(art_values).enter().append("g").attr("class", function(d,i) {return "layer"+" "+"n_"+i})
.attr("transform", function(d,i) {
	return "translate(0,"+parseInt(findSection(d.section))*10+")"
	});

//Define lines layer
var lines = layer.append("g").selectAll("line").data(function(d) {
	return d.steps;
}).enter();

//Define rects layer
var rect = layer.selectAll("rect").data(function(d) {
	return d.steps;
}).enter();

//ADD THE RECTANGLES
var myrects = rect.append("rect")
	.filter(function(d) {
		if (d.length>0) return true;
				else return false;
	})
	.style("fill","#fff")
	.style("stroke", "#ccc")
	.style("stroke-width",1)
	.style("fill", function(d) {
		if(d.diff=="none") return '#fff';
		else if(d.diff=="add") return '#4cefb6';
		else if(d.diff=="rem") return '#f45a5a';
		else if(d.diff=="both") return '#eee';
	})
	.attr("y", function(d) {
		return d.y;
	})
	.attr("x", function(d) {
		//console.log(layer.data())
		return (findStage(d.id_step))*width/columns+10;
	})
	.attr("height", function(d) {
		
		return (d.length*artHeight);
	})
	.attr("width", width/columns-20)
	.attr("opacity", 1.0)
	.on("click", function (d) {
		console.log(d)
		
		//STYLE OF CLICKED ELEMENT AND ROW
		//Reset Colors
		myrects.style("fill", function(d) {
		if(d.diff=="none") return '#fff';
		else if(d.diff=="add") return '#4cefb6';
		else if(d.diff=="rem") return '#f45a5a';
		else if(d.diff=="both") return '#eee';
		});
		
		//Color the elements in same group
		datum=d3.select(this.parentNode)
		d3.selectAll(datum[0][0].childNodes)
		.style("fill","#DAD1CB");
		
		d3.select(this).style("fill","#716259");
		
		//add text
		$("#law-title").text(datum.datum().titre);
		$(".text p").text(d.text)
		
		});
		

//ADD THE LINES
		lines
		.append("line")
		.filter(function(d,i) {	
				datum=d3.select(this.parentNode).datum()
				
				if (d.length>0 && !d.last && datum.steps[i+1].length>0) return true;
				else return false;
		})
		.attr("x1", function(d){
			
			return (1+findStage(d.id_step))*width/columns-10
		})
		.attr("y1", function(d){
			return d.y+(d.length*artHeight)/2 
		})
		.attr("x2", function(d,i){
			
			datum=d3.select(this.parentNode).datum()
			if (i+1<datum.steps.length) return (1+findStage(d.id_step))*width/columns+10
			else return null
		})
		.attr("y2", function(d,i){
			datum=d3.select(this.parentNode).datum()
			if (i+1<datum.steps.length) return datum.steps[i+1].y+(datum.steps[i+1].length*artHeight)/2
			else return null
		})
		.style("stroke", "#f2f2f2")
		.style("stroke-width",1);
		
addLabels();
	
//SETS COORDINATES FOR THE RECTANGLES
function setCoordinates() {

section="";

$.each(d3.values(art_values), function( index, value ) {
	
	changed = false
	if (value.section!=section) { 
		section=value.section;
		changed=true;
	}
		
  $.each(value.steps, function( st_ind, step ) { 	
  	if(index==0) {
  		art_values[index].steps[st_ind]['y'] = 0;
  	}
  	else {
  		lasty=findLast(index-1,art_values[index].steps[st_ind]['id_step'])
  		if (lasty) {
  			art_values[index].steps[st_ind]['y'] = lasty.y + lasty.length*artHeight
  			if(art_values[index].steps[st_ind]['y']+art_values[index].steps[st_ind]['length']*artHeight>maxy) maxy = art_values[index].steps[st_ind]['y']+art_values[index].steps[st_ind]['length']*artHeight
  		}
  		else {
  			art_values[index].steps[st_ind]['y']=0
  		}
  	}
  	if(st_ind+1==value.steps.length) step.last=true
  	if(findStage(step.id_step)==0 && st_ind==0 && changed) {
  		value.first=true
  	}
  })
});
}

//FIND THE ABOVE RECTANGLE - RECURSIVE
function findLast(i1,i2) {
	
	if(i1<0) {
		return null;
	}
	ret=null;
	$.each(art_values[i1].steps, function( st_ind, step ) { 
	if(step.id_step==i2) {
		ret=step;
		return false;
		}
	});
	if(ret) return ret
	else return findLast(i1-1,i2)	
}

//Adds the labels
function addLabels() {
	layer.each(function(d, i) {
		if(d.first) {
			curry=d.steps[0].y
			$(".labels").append("<div style='top:"+(curry)+"px'><p>Section "+d.section +"</p></div>")
		}	
	})
}

//Computes the stages involved in the law creation
function computeStages() {
	
	stag=[]
	
	art_values.forEach(function(e, i) {	
		var st=d3.nest()
		.key(function(d) { return d.id_step; })
		//.entries(e.steps)
		.map(e.steps, d3.map);
		//console.log(d3.keys(st))
		d3.keys(st).forEach (function(f, i) {
			if(stag.indexOf(f)<0) stag.push(f)
		})
	})
	return stag
}

//finds a stage in the stages array
function findStage(s) {

	for(st in stages) {
		
		if (encodeURI(s)==encodeURI(stages[st]).substring(3)) {
			return parseInt(st)
		}
	}
	return -1
}

//computes the sections of the current law
function computeSections() {

		var se=d3.nest()
		.key(function(d) { return d.section; })
		//.entries(e.steps)
		.map(art_values,d3.map);
		return se.keys()
}

//finds a section in the sections array
function findSection(s) {
	res= sections.indexOf(s);
	return res
} 
