(function() {

	var thelawfactory = window.thelawfactory || (window.thelawfactory = {});

	thelawfactory.mod0_bars = function() {

		function vis(selection) {
			
			var barcontainer=d3.select("#barchart")
			var width = parseInt(barcontainer.style("width"))
			var width = parseInt(barcontainer.style("width"))
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
					.attr("style","width:"+(w*95/100)+"px; margin-right:"+(w*5/100)+"px");
			
					step.append("div")
					.attr("class","bar-value")
					.attr("style","height:"+bscale(e.value)+"px; width:100%; top:"+bscale(m-e.value)+"px");
			
					step.append("div")
					.attr("class","bar-key")
					.text(e.key)
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
		
	}
})()
