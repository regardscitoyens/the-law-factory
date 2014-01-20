(function(){

  var thelawfactory = window.thelawfactory || (window.thelawfactory = {});

  thelawfactory.mod1 = function(){

  	function vis(selection){
    	selection.each(function(data){
        
        var try_diff = d3.values(data.articles);
        try_diff.forEach(function(d,i){
          d.steps.forEach(function(f,j){  
            if(j != 0){
              f.textDiff = []
              f.text.forEach(function(g,k){

                if(d.steps[j-1].text[k]){
                f.textDiff[k] = diffString(d.steps[j-1].text[k], g)
                }
                else{f.textDiff[k] = g}
              })
             }
            else{f.textDiff = f.text }
          });
        })

        var artHeight=0.01;
        var art_values=d3.values(data.articles)
        art_values.sort(function(a, b) {
          al=a.titre.split(" ")
          bl=b.titre.split(" ")
          if (parseInt(al[0]) != parseInt(bl[0]))
           return parseInt(al[0]) - parseInt(bl[0]);
          else {
            for (var i_s=0; i_s<a.steps.length; i_s++) {
              for (var j_s=0; j_s<b.steps.length; j_s++) {
                if (a.steps[i_s]['id_step'] == b.steps[j_s]['id_step']) {
                  return a.steps[i_s]['order'] - b.steps[j_s]['order'];
            } } }
            return al.length - bl.length ;
          }
        });

        var maxlen=d3.max(art_values,function(d){
          return d3.max(d.steps,function(e) {
            return e.length;  
          })
        });

        //linear mapper for article height
        var lerp = d3.scale.linear()
          .domain([0,1,maxlen])
          .range([0,6,120]);

        //compute stages and sections
        var stages=computeStages()
        var columns=stages.length
        var sections=computeSections()
        var maxy=0;

        //set coordinates for the blocks
        setCoordinates();

        var margin = {
          top : 10,
          right : 10,
          bottom : 20,
          left : 0
        }, width = $("#viz").width(), height = 800 - margin.top - margin.bottom;


        var svg = d3.select("#viz").append("svg").attr("width", "100%" ).attr("height", maxy+sections.length*30+100).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var sects=svg.append("g").attr("class","sections")

        var layer = svg.selectAll(".layer").data(art_values).enter().append("g").attr("class", function(d,i) {return "layer"+" "+"n_"+i})
        .attr("transform", function(d,i) {
          return "translate(0,"+(20+parseInt(findSection(d.section))*30)+")"
          });

        //Define lines layer
        var lines = layer.append("g").selectAll("line").data(function(d) {
          return d.steps;
        }).enter();

        //Define rects layer
        var rect = layer.selectAll("rect").data(function(d) {
          return d.steps;
        }).enter();

        var stylise_rects = function(){
          myrects.style("stroke", "#ccc")
          .attr("class","article")
          .style("stroke", "#ccc")
          .style("stroke-width", 1)
          .style("stroke-dasharray","none")
          .style("fill", function(d) {
            if (d.status == 'sup') return '#fff';
            else if (d.diff == 'none') return '#f3f3f3';
            else {
             var lev = ~~(225 - 128 * d.n_diff);
             return 'rgb('+lev+','+lev+','+lev+')';
            };
          });
        }
        //ADD THE RECTANGLES
        var myrects = rect.append("rect")
          .filter(function(d) {
            if (d.length>0 || d.status == "sup") return true;
                else return false;
          });

          stylise_rects();
          myrects.attr("y", function(d) {
            return d.y;
          })
          .attr("x", function(d) {
            return (findStage(d.id_step))*width/columns+10;
          })
          .attr("height", function(d) {
            
            return (lerp(d.length)-1);
          })
          .attr("width", width/columns-20)
          .attr("opacity", 1.0)
          .on("click", onclick)
          .popover(function(d){

              var datum=d3.select(this.parentNode).datum()

              var titre = datum.titre,
                  section = datum.section,
                  status = d['id_step'].replace(/_/g, ", "),
                  length = d['length'];

              var div;
              div = d3.select(document.createElement("div"))
                    .style("height", "100px")
                    .style("width", "100%")

              div.append("p").text("Section: " + section )
              div.append("p").text("Status: " + status)
              div.append("p").text("Text length: " + length)

              return {        
              title: "Article " + titre,
              content: div ,
              placement: "mouse",
              gravity: "right",
              displacement: [10, -85],          
              mousemove: true
              };
            });
            
        //ADD THE SECTION TITLES
        myrects.filter(function(d){
          return d['section-head']
        }).each(function(e){
            d3.select(this.parentNode).append("rect")
            .attr("x",findStage(e.id_step)*width/columns+10)
            .attr("y",e.y-15)
            .attr("width",width/columns-20)
            .attr("height",15)
            .style("fill","#D80053")
            .style("stroke","D90154")
            .style("stroke-width","1px")

            d3.select(this.parentNode)
            .append("text")
            .attr("x",findStage(e.id_step)*width/columns+15)
            .attr("y",e.y-4)
            .attr("font-family", "sans-serif")
            .attr("font-size", "10px")
            .style("fill","white")
            .text("Sect. "+e['section']);
        })
        
        
        myrects.filter(function(d){
          return d['status']=="new";
        }).each(function(d,i) {
        d3.select(this.parentNode)
        .append("rect")
        .attr("class","first")
          .style("stroke", "none")
          .style("fill", '#8DF798')
          .attr("y",  d.y+1)
          .attr("x", findStage(d.id_step)*width/columns+11)
          .attr("height", lerp(d.length)-3)
          .attr("width", 6)
          .attr("opacity", 1.0);
        })
        
        
        myrects.filter(function(d){
          return d['status']=="sup";
        }).each(function(d,i) {
        d3.select(this.parentNode)
        .append("rect")
        .attr("class","last")
          .style("fill", '#FD5252')
          .attr("y", d.y+1)
          .attr("x", findStage(d.id_step)*width/columns+11)
          .attr("height", lerp(d.length)-3)
          .attr("width", 8)
          .attr("opacity", 1.0);
        d3.select(this.parentNode)
        .append("rect")
        .attr("class","last")
          .style("stroke", "#FFF")
          .style("stroke-width", 1)
          .style("fill", '#FFF')
          .attr("y", d.y+1)
          .attr("x", (findStage(d.id_step)+1)*width/columns-11)
          .attr("height", lerp(d.length)-3)
          .attr("width", 2)
          .attr("opacity", 1.0);
        })
        

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
              return d.y+(lerp(d.length))/2 
            })
            .attr("x2", function(d,i){
              
              datum=d3.select(this.parentNode).datum()
              if (i+1<datum.steps.length) return (1+findStage(d.id_step))*width/columns+10
              else return null
            })
            .attr("y2", function(d,i){
              datum=d3.select(this.parentNode).datum()
              if (i+1<datum.steps.length) return datum.steps[i+1].y+(lerp(datum.steps[i+1].length))/2
              else return null
            })
            .style("stroke", "#dadaf0")
            .style("stroke-width",1);
            
        addLabels();
          
        //SETS COORDINATES FOR THE RECTANGLES
        function setCoordinates() {

        section="";

        $.each(d3.values(art_values), function( index, value ) {
          
          changed = false
          if (value.section!=section) { 
            section=value.section;
            value["section-head"]=true
            changed=true;
          }
            
          $.each(value.steps, function( st_ind, step ) { 
              
            if(index==0) {
              art_values[index].steps[st_ind]['y'] = 0;
              art_values[index].steps[st_ind]['section']=value.section
              art_values[index].steps[st_ind]["section-head"]=true
            }
            else {
              art_values[index].steps[st_ind]['section']=value.section

              lasty=findLast(index-1,art_values[index].steps[st_ind]['id_step'])
              
              //Checks previous element of vertical stack
              if (lasty) {
                
                art_values[index].steps[st_ind]['y'] = lasty.y + lerp(lasty.length)
                
                if(art_values[index].steps[st_ind]['y']+lerp(art_values[index].steps[st_ind]['length'])>maxy) {
                  maxy = art_values[index].steps[st_ind]['y']+lerp(art_values[index].steps[st_ind]['length'])
                }
                
                if(art_values[index].steps[st_ind].section!==lasty.section) {
                  art_values[index].steps[st_ind]["section-head"]=true
                }
              }
              else {
                art_values[index].steps[st_ind]["section-head"]=true
                art_values[index].steps[st_ind]['y']=0
              }
            }
            if(st_ind+1==value.steps.length) step.last=true
            //if(findStage(step.id_step)==0 && st_ind==0 && changed) {
             if(st_ind==0) {
               //console.log("first",st_ind)
               step.first=true;
              
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
          if(step.id_step==i2 && step.length>0) {
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
           	
              if(stag.indexOf(f)<0){           	 
              	 stag.push(f)
              	}
            })
          })
          
          for(s in stag) {
            //console.log(stag[s])
            stag_name=stag[s].split("_",3).splice(1, 2).join(" ");
            //console.log(stag_name);
            $(".stages").append('<div class="stage" style="width:'+100/stag.length+'%">'+stag_name+'</div>')  
          }
          
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

		//USE THE ARROWS
		d3.select("body")
    	.on("keydown", function() {
    		if(d3.select(".curr").empty()) {
    			//console.log("no one selected")
    			d3.select(".article")
    			.each(onclick);	
    		}
    		else{
    			c=(d3.select(".curr"))
    			cur=c.datum();
    			
    			//LEFT
    			if(d3.event.keyCode==37 && !cur.first) {
    				d3.select($(".curr").prev().get([0])).each(onclick)
    			}
    			//RIGHT
    			else if(d3.event.keyCode==39 && (!cur.last && cur['status']!=="sup")) {
    				d3.select($(".curr").next().get([0])).each(onclick)
    			}
    			
    			else if(d3.event.keyCode==38 || d3.event.keyCode==40) {
    				
    				d3.event.preventDefault();
    				
    				var g = $(".curr").parent()
    				var classes = g.attr('class').split(' ')
    				n = parseInt(classes[1].split("_")[1])
    				found=false;
    				end=false;
    				el=null;
    				
    				if(d3.event.keyCode==38 && n>0) {
    				
    				while(!found && !end) {
    					
    					a = d3.select(".n_"+(n-1))
    					.selectAll(".article")
    					.filter(function(u){
    						
    						return (u.id_step === cur.id_step)
    					})
    					
    					if(a[0].length>0) {
    						el=a[0][0];
    						found=true;
    					}
    					else {
    						if(n>1) n=n-1;
    						else end=true;	
    					}
    				}
    				
    				}
    				
    				else if(d3.event.keyCode==40 && n<art_values.length-1) {
    					
    					while(!found && !end) {
    					
    					a = d3.select(".n_"+(n+1))
    					.selectAll(".article")
    					.filter(function(u){
    						
    						return (u.id_step === cur.id_step)
    					})
    					
    					if(a[0].length>0) {
    						el=a[0][0];
    						found=true;
    					}
    					else {
    						if(n<art_values.length-2) n=n+1;
    						else end=true;	
    					}
    				}
    					
    					
    				}
    				
    				d3.select(el).each(onclick);
    				
    			}		
    							
    		}
    		// 37=LEFT, 38=UP, 39=RIGHT, 40=DOWN
    	});


		function onclick(d) {
			//console.log(d)
			d3.selectAll("line")
            .style("stroke", "#dadaf0");
            
            //STYLE OF CLICKED ELEMENT AND ROW
            //Reset rectangles
            stylise_rects();
            d3.selectAll(".curr").classed("curr",false);
            d3.select(this).classed("curr",true);
            //Select the elements in same group
            datum=d3.select(this.parentNode)
            
            d3.selectAll(datum[0][0].childNodes).filter("rect.article")
            .style("stroke", "#D80053")
            .style("stroke-width", 1)
            .style("fill",function(d) {
              hsl=d3.rgb(d3.select(this).style("fill")).hsl()
              hsl.s+=0.1;
            return hsl.rgb()
            })

            d3.selectAll(datum[0][0].childNodes).filter("g")
            .selectAll("line")
            .style("stroke","#D80053");
            
            d3.rgb(d3.select(this).style("fill")).darker(2)
            
            d3.select(this)
            .style("stroke-dasharray",[3,3])
            
            var da=datum.datum()
            var titre = da.titre,
                section = da.section,
                status = d['id_step'].replace(/_/g, ", "),
                length = d['length'];
            $(".art-meta").html("<p><b>Section:</b> "+section+"</p><p><b>Status:</b> "+status+"</p><p><b>Text length:</b> "+length+"</p><p><b>Text:</b></p>")
            $("#law-title").text("Article "+datum.datum().titre);
            $(".art-txt").html(d.textDiff.join("<br/><br/>"))
            //$(".text-container p").html(d.textDiff)
				
		}

		$(".separator").append('<h4 class="law-title">'+data.law_title+'</h4>')

        $(document).ready(function() {
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
        
        


    	}); //end selection.each
    }; //end function vis

    return vis;
  };

})();
