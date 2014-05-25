var num=0;
var svg, mydata;
var participants, utils, highlight;
var width;

function wrap(width) {
  d3.selectAll('text').each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word, l,
        line = [],
        lines = [],
        lineNumber = 0,
        lineHeight = 1.2, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        dx = parseFloat(text.attr("dx")),
        devy = 0,
        tspan = text.text(null).append("tspan");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        lines.push(line.join(" "));
        line = [word];
      }
    }
    lines.push(line.join(" "));
    devy = lineHeight * (lines.length - 1) / 2;
    tspan.attr("x", 0).attr("y", y).attr("dy", dy - devy + "em").text(lines.shift());
    while (l = lines.shift())
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy - devy + "em").attr("dx",dx).text(l);
  });
}

function init(data,step) {

    utils = $('.mod2').scope();
    width = $("#viz").width();
    highlight = utils.highlightGroup;
    utils.groups = data[step].groupes
    participants=data[step].orateurs;
    mydata=[];
    var divs=d3.values(data[step].divisions).sort(function(a,b){return a.order - b.order;}),
        orderedGroupes = d3.keys(utils.groups).sort(function(a,b){return utils.groups[a].order - utils.groups[b].order});
    utils.drawGroupsLegend();
    d3.entries(utils.groups).forEach(function(d){
        mydata.push({key: d.key,
                     values: [],
                     color: utils.adjustColor(d.value.color),
                     name: d.value.nom});
    });

    d3.entries(data[step].divisions).forEach(function(a,b){
        a.value.step = a.key;
    });
    num = divs.length;
    divs.forEach(function(f,j){
        var gp = d3.entries(f.groupes);
        orderedGroupes.forEach(function(g,h){
            var filtered = gp.filter(function(k,l){
                    return k.key.toLowerCase()===g.toLowerCase()
                }),
                curr = mydata.filter(function(e,n){
                    return e.key.toLowerCase()===g.toLowerCase()
                })[0];
            if (filtered.length) {
                filtered=filtered[0]
                toAdd={label:g,value:filtered.value.nb_mots,step:f.step,speakers:filtered.value.orateurs}
                curr.values.push(toAdd)
            } else {
                toAdd={label:g,value:null,step:f.step}
                curr.values.push(toAdd)
            }
        });
    });
    drawFlows(false);
}

function drawFlows(top_ordered) {
    $("#display_menu .chosen").removeClass('chosen');
    $("#display_menu #dm-"+(top_ordered ? 'quanti' : 'classic')).addClass('chosen');
    if (top_ordered) {
	$('#menu-order .selectedchoice').text("quantitatif");
    }else{
	$('#menu-order .selectedchoice').text("de l'échiquier politique");
    }
    utils.startSpinner();
    var height;
    if(num*60>=$("#viz").height()) height=num*60;
    else height=$("#viz").height()-50;
    $("#viz-int").animate({opacity: 0}, 200, function() {
        $("#viz-int").empty();
        $(".text-container").empty();
        var offset = Math.round(width/5);
        var stream = sven.viz.streamkey()
            .data(mydata)
            .target("#viz-int")
            .height(height)
            .width(width)
            .minHeight(8)
            .sorting(top_ordered)
            .init();
        d3.selectAll("g:not(.main-g)").attr("transform","translate("+offset+",0) scale("+(width-offset)/width+",1)");
        wrap(offset-25);
        utils.stopSpinner(function() {
            $("#viz-int").animate({opacity: 1}, 500);
        });
    });
}

sven = {},
sven.viz = {};

sven.viz.streamkey = function(){

    var streamkey = {},
        data,
        sorting,
        width = 600,
        height = 200,
        barWidth = 36,
        barPadding = 6,
        minHeight = 0,
        margin = {top: 30, right: 30, bottom: 30, left: 12},
        mX,
        mY,
        n,
        m,
        target,
        colors = ["#afa", "#669"],
        graphWidth = width - margin.left - margin.right,
        graphHeight = height - margin.top - margin.bottom,
        streamWidth = graphWidth - barWidth,
        filter_small = function(d) {return d['value'] != null};

    streamkey.data = function(x){
        if (!arguments.length) return data;
        data = x;
        return streamkey;
    };

    streamkey.sorting = function(top_ordered){
        if (top_ordered) sorting = sortByTop;
        else sorting = sortByGroupe;
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
            i, j;
        n = data.length;
        m = data[0]['values'].length;
        //get values
        data.forEach(function(d,i){
            d['values'].forEach(function(d){if(d['value'] != null){values.push(d['value'])}})
        });

        //get steps
        for(j = 0; j < m; ++j)
            steps.push(data[0]['values'][j]['step']);

        //min height scale
        var setMinHeight = d3.scale.linear().domain([d3.min(values),d3.max(values)]);

        //sort data, compute baseline and propagate it
        var dataF = layout(sorting(data),setMinHeight);

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

        svg = d3.select(target).append("svg")
            .attr("width", height)
            .attr("height", width+40)
            .append("g")
            .attr("class","main-g")
            .attr("transform","translate(0,30)")

        var layer = svg.selectAll("g")
            .data(dataF)
            .enter().append("g")
            .attr("class", function(d, i) {return "layer_"+i; })
            .style("fill", function(d, i) {return utils.adjustColor(d[0].color).toString(); })
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .on("mousemove",function(d){d3.select(".desc").attr("style","top: " + (d3.event.pageY - $(".desc").height() - 15) + "px; left:"+ (d3.event.pageX - $(".desc").width()/2) + "px");});
        d3.select("svg").on("click", function(){ 
            d3.selectAll(".focused").classed('focused', false);
            utils.resetHighlight('ints');
        });

        var rect = layer.selectAll("rect")
            .data(function(d) { return d; })
            .enter().append("rect")
            .filter(filter_small)
            .attr("class", function(d) { return utils.slugGroup(d.category)})
            .attr("y", function(d) { return x(d.x); })
            .attr("x", function(d) { return y(d.y0 + d.y); })
            //.attr("rx", "3px")
            //.attr("ry", "3px")
            .style("opacity",.9)
            .style("stroke-width",1)
            .style("stroke",function(d){return d.color.darker().toString()})
            .attr("width", function(d) { return y(d.y0) - y(d.y0 + d.y); })
            .attr("height", barWidth)
            .attr("cursor", "pointer")
            .attr("display", "inline")
            .on("click",function(d){
                d3.event.stopPropagation();
                $("#text-title").html(d.label);
                $(".text-container").empty()
                $(".text-container").append('<p class="orat-title">'+d.x+"</p>");
                d3.selectAll("path").transition().style("fill-opacity",0.1);
                d3.selectAll("rect").transition().style("opacity",0.1);
                d3.selectAll(".focused").classed('focused', false).classed('main-focused', false);
                d3.select(d3.select(this).node().parentNode).selectAll("path").classed('focused', true).transition().style("fill-opacity",0.45);
                d3.select(d3.select(this).node().parentNode).selectAll("rect").classed('focused', true).transition().style("opacity",0.55);
                d3.select(this).classed('main-focused', true).transition().style("opacity",1);

                spArray= d3.entries(d.speakers).sort(function(a,b){return b.value.nb_mots - a.value.nb_mots});
                spArray.forEach(function(g,j){
                    var ordiv = document.createElement('div');
                    ordiv.className="orateur";
                    var div = document.createElement('div');
                    div.className="orat-info";
                    var siz = $(".text-container").width()*0.25;
                    if(participants[g.key].photo) $(div).append('<a href="'+participants[g.key].link+'" target="_blank"><img src="'+participants[g.key].photo+"/"+parseInt(siz)+'"/></a>');
                    $(div).append("<p class='orat-name'><b>"+(participants[g.key].photo ? '<a href="'+participants[g.key].link+'" target="_blank">'+participants[g.key].nom+"</a>" : participants[g.key].nom)+"</b></p>");
                    if(participants[g.key].fonction.length) $(div).append("<p class='orat-fonction'>"+participants[g.key].fonction+"</p>");
                    $(div).append('<p><a class="orat-disc" href="'+g.value.link+'" target="_blank">Lire les interventions</a></p>');
                    $(ordiv).append(div);
                    div = document.createElement('div');
                    div.className="orat-count";
                    $(div).append("<span>"+g.value.nb_mots+"<br/>mots</span>");
                    $(ordiv).append(div);
                    $(".text-container").append(ordiv);
                })
            })
            .popover(function(d){
                var orateurs = (d.speakers ? Object.keys(d.speakers).length : 0),
                    div = d3.select(document.createElement("div")).style("width", "100%");
                div.append("p").html("<b>"+ d.x + "</b>");
                div.append("p").html(d.value+" mots prononcés par "+orateurs+" orateur" + (orateurs > 1 ? 's': ''));
                return {
                    title: d.label,
                    content: div,
                    placement: "mouse",
                    gravity: "right",
                    displacement: [10, -80],
                    mousemove: true
                };
            })
            .on('mouseenter', function(d){ highlight(d.category);})
            .on('mouseleave', utils.resetHighlight);

        var stream = layer.selectAll("path")
            .data(function(d){return areaStreamKey(d, xF)})
            .enter().append("path")
            .filter(function(d){return d[4]})
            .attr("d", function(d){return drawLink(d[0], d[1], d[2], d[3])})
            .style("fill-opacity", 0.3)
            .attr("class", function(d){return utils.slugGroup(d[5]); })
            .attr("stroke", "none")
            .attr("display", "inline");

                //labels
        var stepsLabel = svg.selectAll("text")
            .data(steps)
            .enter().append("text")
            .attr("y", function(d) { return x(d) + margin.left; })
            .attr("x", function(d) { return y(mY) + margin.top; })
            .attr("dx", 10)
            .attr("dy", 0.7)
            .attr("font-family","sans-serif")
            .attr("font-size","0.9em")
            .attr("class", "filter-title")
            .attr("fill", "#716259")
            .text(function(d){return utils.shortenString(d, 110); });

        return streamkey;
    };

    function sort(data, sorting_key, sorting_function){
        var stepsY = [];
        //from fluxs to steps and sorting
        for (j = 0; j < m; ++j) {
            stepsY[j] = [];
            for (i = 0; i < n; i++)
                stepsY[j].push({'y':data[i]['values'][j]['value'],'value': data[i]['values'][j]['value'], 'index':i, 'x':data[i]['values'][j]['step'],'color':data[i]['color'],'speakers':data[i]['values'][j]['speakers'] ,'category':data[i]['key'], 'label':data[i]['name']});
            var sorted = d3.nest().key(function(d){return d[sorting_key]})
                .sortKeys(sorting_function)
                .entries(stepsY[j]);
            stepsY[j] = [];
            sorted.forEach(function(d){d.values.forEach(function(d){stepsY[j].push(d)})});

        }
        return stepsY;
    };

    sortByGroupe = function(data){
        return sort(data, "category", function(a,b){return utils.groups[b].order - utils.groups[a].order; });
    }

    sortByTop = function(data){
        return sort(data, "y", function(a,b){if(a==="null") a=0; if(b==="null") b=0; return parseFloat(a) - parseFloat(b); });
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
      for (i = 0, o = 0; i < n; i++)
          o += data[j][i]['y'];
      if (o > max) max = o;
      sums.push(o);
    }

     scaledBarPadding = barPadding*max/graphHeight;
     scaledMinHeight = minHeight*(max + scaledBarPadding * n)/graphHeight;

     minHeightScale.range([minHeightScale.domain()[0] + scaledMinHeight ,minHeightScale.domain()[1] + scaledMinHeight]);

    for (j = 0; j < m; ++j)
      y0[j] = (max - sums[j]) / 2 ;

    //...and propagate it to other
    for (j = 0; j < m; ++j) {
        o = y0[j];

        for (i = 0; i < n; i++){
            data[j][i]['y'] = minHeightScale(data[j][i]['y'])
            if (i && data[j][i-1]['value'] != null)
                o += data[j][i-1]['y'] + scaledBarPadding;
            data[j][i]['y0'] = o;
        }
    }

    //from steps to fluxs
    for (j = 0; j < n; ++j) {
        dataInit[j] = [];
        for (i = 0; i < m; i++)
            dataInit[j][i] = []
    }

    data.forEach(function(d,i){
        d.forEach(function(e,h){
            dataInit[e.index][i] = e;
        })
    });
    return dataInit;
  }

    function areaStreamKey(data, xScale){
        var steps = [];
        data.forEach(function(d,i){
          if (i < mX) {
            var label = d.category,
                vis = filter_small(d) && filter_small(data[i+1]),
                points = [],
                p0 = [ graphHeight - (d.y + d.y0 ) * graphHeight / mY ,xScale(d.x)*streamWidth/mX + barWidth], // upper left point
                p1 = [ graphHeight - (data[i+1].y + data[i+1].y0) * graphHeight / mY , xScale(data[i+1].x)*streamWidth/mX], // upper right point
                p2 = [ graphHeight - (data[i+1].y0 * graphHeight / mY) ,xScale(data[i+1].x)*streamWidth/mX], // lower right point
                p3 = [ graphHeight - ((d.y0) * graphHeight / mY),xScale(d.x)*streamWidth/mX + barWidth]; // lower left point
            points.push(p0,p1,p2,p3,vis,label);
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
        return "M" + p4x + "," + p4y    // starting point, i.e. upper left point
             + "C" + p4x + "," + m        // control point
             + " " + p3x + "," + m        // control point
             + " " + p3x + "," + p3y    // reach the end of the step, i.e. upper right point
             + "L" + p2x + "," + p2y    // reach the lower right point
             + "C" + p2x + "," + m
             + " " + p1x + "," + m
             + " " + p1x + "," + p1y
             + "Z";        // close area
    };

    return streamkey;

};
