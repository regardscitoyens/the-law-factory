(function(){

  var thelawfactory = window.thelawfactory || (window.thelawfactory = {});

  thelawfactory.mod2 = function(){

  	function vis(selection){
    	
		var clean=[]
		
		var statColor= {
			"Adopté": "#229850",
			"Satisfait":"#91CF60",
			"Non soutenu":"#ede1c2",
		    "Indéfini":"#FEE08B",
		    "Retiré":"#FB8D59",
		    "Tombe":"#db856f",
		    "Rejeté":"#D73127",
		    "Irrecevable":"#6d250a"
		}
		
		var sel=selection[0][0].__data__;
		console.log("selection",sel.amendements)
		sel["amendements"].forEach(function(d,i) {clean.push(d.amendement)})
		
		var fin = d3.nest()
		.key(function(d) { return d.sujet; })
		.sortKeys(d3.ascending)
		.entries(clean);
		
		var jumpLines = 0
		var offset = 0
		
		var w = $("#viz").width()-30,
		    rw = $("#viz").width(),
		    lineh = 30,
		    h = lineh*fin.length+40,
		    z = 20,
		    x = Math.round(w / z),
		    y = h / z;
		
		var svg = d3.select("#viz").append("svg")
		    .attr("width", rw)
		    .attr("height", h);
		
		fin.forEach(function(d,i) {
		
		  len = d.values.length;
		  lines = Math.ceil(len/x);
		
		  d.offset = offset
		  
		  var curRow = svg.append("g")
		  .attr("class",d.key.replace(/ /g, '_'))
		  .attr("transform","translate("+10+","+(i*lineh+10+jumpLines*(lineh-10))+")")
		  .call(function(){	
		  	n=d.values.length;
		  	offset = Math.floor(n/x)
		  	jumpLines = jumpLines + Math.floor(n/x);
		  })
		  
		  
		
		  var bg = curRow
		  .selectAll(".bg")
		  .data(d3.range(x*lines))
		  .enter()
		
		  bg.append("rect")
		  .attr("x", function(f){ return (f % x) * z +1 })
		  .attr("y", function(f){ return Math.floor(f / x) * z + 1 })
		  .attr("width", z-2)
		  .attr("height", z-2)
		  .attr("rx",2)
		  .attr("ry",2)
		  .attr("class","bg")
		  .style("fill", "#E6E6E6")
		
		
		  margin = d.offset == 0 ? 'style="margin-top : 10px"' : 'style="margin-top : '+(10+20*d.offset)+'px "' 
		  if(d.key.length<20) $(".art-list").append("<p "+margin+" >"+d.key+"</p>")
	      else $(".art-list").append("<p "+margin+" >"+d.key.substring(0,17)+"..."+"</p>")

		
		  var amds = curRow
		  .selectAll(".amd")
		  .data(d.values)
		  .enter()
		
		  amds.append("rect")
		  .attr("x", function(f,i){ return (i % x) * z +1 })
		  .attr("y", function(f,i){ return Math.floor(i / x) * z + 1 })
		  .attr("width", z-2)
		  .attr("height", z-2)
		  .attr("rx",2)
		  .attr("ry",2)
		  .attr("class","amd")
		  .style("fill", color)
  			.popover(function(d){

              var titre = d.numero,
                  section = d.sujet,
                  status = d.sort,
                  expo = d.expose;

                  if (expo && expo.length>=90) expo = expo.substring(0,87)+"...";
                  else if(!expo) expo="";

              var div;
              div = d3.select(document.createElement("div"))
                    .style("height", "120px")
                    .style("width", "100%")
                    .attr("class","popup-mod2")
                    
              

              div.append("p").html("<b>Subject:</b> " + section+"<br/><br/>")
              div.append("p").html("<b>Status:</b> " + status+"<br/><br/>")
              div.append("p").html("<b>Expose:</b> " + expo+"<br/><br/>")

              return {        
              title: "Amendement " + titre,
              content: div ,
              placement: "mouse",
              gravity: "right",
              displacement: [10, -90],          
              mousemove: true
              };
            })
            .on("click",select);
		})
		
        
		function select(d) {
			d3.selectAll(".actv-amd")
			.style("fill",color)
			.style("stroke","none" )
			.classed("actv-amd",false);

			
			d3.select(this)
			.attr("class","actv-amd")
			//.style("fill","#fff")
			.style("stroke","#D80053" )
			.style("stroke-width","2" )
			$("#law-title").text("Amendement "+d.numero)
			
			$(".text-container").html(
				"<p><b>Date:</b> " + d.date+"<br/><br/></p>" +
				"<p><b>Subject:</b> " + d.sujet+"<br/><br/></p>" +
				"<p><b>Proponents:</b> " + d.signataires+"<br/><br/></p>" + 
				"<p><b>Status:</b> " + d.sort+"<br/><br/></p>" +
				"<p><b>Expose:</b> " + d.expose+"<br/><br/></p>" +
				"<p><b>Text:</b> " + d.texte+"<br/><br/>");
		}
		
		
		function color(d) { 
			
			stats = d3.keys(statColor)
			found = $.inArray(d.sort, stats);
		    if(found >= 0) return statColor[stats[found]];
		    else return "#E6E6E6"
		    };

		function legend(t) {
			
			if(t==null) {
				console.log("aaggrr")
				d3.entries(statColor).forEach(function(d,i) {
					
					$(".colors").append('<div class="leg-item"><div class="leg-value" style="background-color:'+d.value+'"></div><div class="leg-key">'+d.key+'</div></div>')		
					
				})
			}
		}

        $(document).ready(function() {
        	legend();
            var s = $(".text");
            var pos = s.offset();
            var w=s.width();
            //console.log("pos",pos)                    
            $(window).scroll(function() {
                var windowpos = $(window).scrollTop();
                if (windowpos >= pos.top) {
                    s.addClass("stick");
                    s.css("left",pos.left);
                    s.css("width",w);
                } else {
                    s.removeClass("stick"); 
                    s.css("left","");
                    s.css("width","25%");
                }
            });
        });


    }; //end function vis

    return vis;
  };

})();