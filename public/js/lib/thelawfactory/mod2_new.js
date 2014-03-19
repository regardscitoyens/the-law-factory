var sortByStat;
var draw;
var drawMerged;
var grouped=null;


(function(){

  var thelawfactory = window.thelawfactory || (window.thelawfactory = {});

  thelawfactory.mod2 = function(){

  	function vis(selection){
    	
		var groups,articles;
		
	selection.each(function(d,i){
		groups=d.groupes;
		articles=d.sujets;
	})
	
	artArray=d3.values(articles).sort(function(a,b){return a.order-b.order})
	console.log(artArray)
	console.log("groups", groups)
		
        $(".text").css("height", $(".scrolling").height());
		
		var w = $("#viz").width()-30,
		    rw = $("#viz").width(),
		    lineh = 30,
		    h = lineh*artArray.length+40,
		    z = 20,
		    x = Math.round((w-40) / z),
		    y = h / z;
	    var jumpLines = 0
		var offset = 0
		var svg = d3.select("#viz").append("svg")
		    .attr("width", rw)
		    .attr("height", h);
		    
	draw = function() {
		jumpLines=0
		$("svg").empty();
			$(".art-list").empty();
		artArray.forEach(function(d,i) {
			drawLines(d,i)
		})
		
		grouped=null;
	}
		
        draw();
        
        function drawLines(d,i) {
        	 len = d.amendements.length;
		  lines = Math.ceil(len/x);
		
		  d.offset = offset
		  
		  var curRow = svg.append("g")
		  .attr("class",d.titre.replace(/ /g, '_'))
		  .attr("transform","translate("+10+","+(i*20+i*lineh+10+jumpLines*(lineh-10))+")")
		  .attr("data-offset", (i*20+i*lineh+10+jumpLines*(lineh-10)))
		  .call(function(){	
		  	n=d.amendements.length;
		  	offset = Math.floor(n/x)
		  	jumpLines = jumpLines + Math.floor(n/x);
		  })
		  
		  var bg = curRow
		  .selectAll(".bg")
		  .data(d3.range(x*lines))
		  .enter()
		
		  bg.append("rect")
		  .attr("x", function(f){ return (f % x) * z +21 })
		  .attr("y", function(f){ return Math.floor(f / x) * z + 21 })
		  .attr("width", z-2)
		  .attr("height", z-2)
		  .attr("rx",2)
		  .attr("ry",2)
		  .attr("class","bg")
		  .style("fill", "#E6E6E6")
		
		
		  var margin = d.offset == 0 ? 'style="margin-top : 10px"' : 'style="margin-top : '+(10+20*d.offset)+'px "';
		  console.log("key",d.key)
          var subj = d.titre
          console.log("subj",subj)
		
		
		curRow.append("text")
		.attr("x",20)
		.attr("y",15)
		.style("fill","#333")
		.attr("font-size","0.85em")
		.text(d.titre)
		
		
		  var amds = curRow
		  .selectAll(".amd")
		  .data(d.amendements)
		  .enter()
		
		  amds.append("rect")
		  .attr("x", function(f,i){ return (i % x) * z +21 })
		  .attr("y", function(f,i){ return Math.floor(i / x) * z + 21 })
		  .attr("width", z-2)
		  .attr("height", z-2)
		  .attr("rx",2)
		  .attr("ry",2)
		  .attr("class","amd")
		  .style("fill", color)
  			.popover(function(d){

              var titre = d.numero,
                  date = d.date,
                  gr = d.groupe,
                  status = d.sort;
 
              var div;
              div = d3.select(document.createElement("div"))
                    .style("height", "120px")
                    .style("width", "100%")
                    .attr("class","popup-mod2")
                    
              div.append("p").html("<b>Date :</b> " + date+"<br/><br/>")
              div.append("p").html("<b>Group :</b> " + gr+"<br/><br/>")
              div.append("p").html("<b>Status :</b> " + status+"<br/><br/>")

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
            
            
            
            var imgs = curRow.selectAll("image").data(d.amendements).enter();
            
            imgs.append("svg:image")
            .attr("x", function(f,i){ return (i % x) * z +25 })
		    .attr("y", function(f,i){ return Math.floor(i / x) * z + 25 })
		    .attr("width", z-10)
		    .attr("height", z-10)
		    .attr("xlink:href",function(e){
		    	if(e.sort==="adopté") return "img/ok.png";
		    	else if(e.sort==="rejeté") return "img/ko.png";
		    	else if(e.sort==="non-voté") return "img/nd.png"})
		    .popover(function(d){

              var titre = d.numero,
                  date = d.date,
                  gr = d.groupe,
                  status = d.sort;
 
              var div;
              div = d3.select(document.createElement("div"))
                    .style("height", "120px")
                    .style("width", "100%")
                    .attr("class","popup-mod2")
                    
              div.append("p").html("<b>Date :</b> " + date+"<br/><br/>")
              div.append("p").html("<b>Group :</b> " + gr+"<br/><br/>")
              div.append("p").html("<b>Status :</b> " + status+"<br/><br/>")

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
            
            
        var a = d3.select("svg").select("g:last-child").attr("data-offset")
		var ah = d3.select("svg").select("g:last-child").node().getBBox().height;
		console.log(a,ah)
		svg.attr("height",parseInt(a)+ah+20)

        }

		function select(d) {
			
			d3.selectAll(".actv-amd")
			.style("fill",color)
			.style("stroke","none" )
			.classed("actv-amd",false);

			id=parseInt(d.url_api.match(/\d+/g)[0]);
			console.log(d.url_api,id)
			
			d3.json("/amd/"+id,function(error,json){
				console.log(error,json)
			})
			
			d3.select(this)
			.attr("class","actv-amd")
			//.style("fill","#fff")
			.style("stroke","#D80053" )
			.style("stroke-width","2" )
			$("#text-title").text("Amendement "+d.numero)
			var source_am = '.fr</a> &mdash; <a href="'+d.source+'">';
            if (d.url_nosdeputes) source_am = '<a href="'+d.url_nosdeputes+'">NosDéputés'+source_am+'Assemblée nationale</a>';
            else source_am = '<a href="'+d.url_nossenateurs+'">NosSénateurs'+source_am+'Sénat</a>';
			$(".text-container").html(
				"<p><b>Date :</b> " + d3.time.format("%d/%m/%Y")(d3.time.format("%Y-%m-%d").parse(d.date)) + "</p>" +
				"<p><b>Objet :</b> " + d.sujet+"</p>" +
				"<p><b>Signataires :</b> " + d.signataires+"</p>" + 
				"<p><b>Statut :</b> " + d.sort+"</p>" +
				"<p><b>Exposé des motifs :</b> " + d.expose+"</p>" +
				"<p><b>Texte :</b> " + d.texte +
				"<p><small><b>Source :</b> " + source_am + "</small></p>");
				
			$('.text-container').scrollTop(0);
			if(!$(".end-tip").is(":visible")) $(".end-tip").fadeIn(200);
		}
		
		
		function color(d) { 
			
			if(groups[d.groupe]) return groups[d.groupe].color 
		    else return "#E6E6E6"
		    };

		function legend(t) {
			
			d3.entries(groups).forEach(function(e,i){
				
				$(".colors").append('<div class="leg-item"><div class="leg-value" style="background-color:'+e.value.color+'"></div><div class="leg-key">'+e.key+'</div></div>')		
				
			})
			
		}

		drawMerged = function() {
			$("svg").empty();

			if(!grouped) {
				grouped = {titre:'all articles',key: 'all articles', amendements:[]}
				
				artArray.forEach(function(d,i) {
					grouped.amendements=grouped.amendements.concat(d.amendements)
				}) 
			}
			console.log(grouped)
			jumpLines=0
			drawLines(grouped,0)
		}
		
		function chk_scroll(e)
		{
			e.stopPropagation();
		    var elem = $(e.currentTarget);
		    if (elem[0].scrollHeight - elem.scrollTop() == elem.outerHeight()) 
		    {
		        $(".end-tip").fadeOut(200);
		    }
		    else {
		    	if(!$(".end-tip").is(":visible")) $(".end-tip").fadeIn(200);
		    	
		    }
		
		}

		
		sortByStat = function() {
			console.log(artArray)
			if(grouped) {
				grouped['amendements'].sort(function(a,b){
					if (a.sort < b.sort) return 1;
					if (a.sort > b.sort) return -1;
					return 0;
				})
				$("svg").empty();
				$(".art-list").empty();
				$(".text-container").empty();
				drawMerged();
				
			}
			else {
				artArray.forEach(function(d,i) {
					d['amendements'].sort(function(a,b){
						if (a.sort < b.sort) return 1;
					if (a.sort > b.sort) return -1;
					return 0;
					})
				})
				$("svg").empty();
				$(".text-container").empty();
				draw();
			}
		}
		
		sortByParty = function() {
			console.log(artArray)
			if(grouped) {
				grouped['amendements'].sort(function(a,b){
					if (a.groupe < b.groupe) return 1;
					if (a.groupe > b.groupe) return -1;
					return 0;
				})
				$("svg").empty();
				$(".art-list").empty();
				$(".text-container").empty();
				drawMerged();
				
			}
			else {
				artArray.forEach(function(d,i) {
					d['amendements'].sort(function(a,b){
						if (a.groupe < b.groupe) return 1;
					if (a.groupe > b.groupe) return -1;
					return 0;
					})
				})
				$("svg").empty();
				$(".text-container").empty();
				draw();
			}
		}
		
		
		
		sortByDate = function() {
			
			if(grouped) {
				grouped['amendements'].sort(function(a,b){
					return Date.parse(a.date) - Date.parse(b.date)	
				})
				$("svg").empty();
				$(".text-container").empty();
				drawMerged();
				
			}
			else {
				artArray.forEach(function(d,i) {
					d['amendements'].sort(function(a,b){
						return Date.parse(a.date) - Date.parse(b.date)	
					})
				})
				$("svg").empty();
				$(".text-container").empty();
				draw();
			}
		}
		
		
        $(document).ready(function() {
        	legend();
        	$('.text-container').bind('scroll',chk_scroll);
        	
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
                    s.css("width","18.33%");
                }
            });
        });


    }; //end function vis

	
    return vis;
  };

})();
