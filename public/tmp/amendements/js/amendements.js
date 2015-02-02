sigma.classes.graph.addMethod('neighbors', function(nodeId) {
  var k, neighbors = {}, index = this.allNeighborsIndex[nodeId] || {};
  for (k in index) neighbors[k] = this.nodesIndex[k];
  return neighbors;
});

// Source Pimp Trizkit https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
function shadeBlend(p,c0,c1) {
  var n=p<0?p*-1:p,u=Math.round,w=parseInt;
  if(c0.length>7){
    var f=c0.split(","),t=(c1?c1:p<0?"rgb(0,0,0)":"rgb(255,255,255)").split(","),R=w(f[0].slice(4)),G=w(f[1]),B=w(f[2]);
    return "rgb("+(u((w(t[0].slice(4))-R)*n)+R)+","+(u((w(t[1])-G)*n)+G)+","+(u((w(t[2])-B)*n)+B)+")"
  }else{
    var f=w(c0.slice(1),16),t=w((c1?c1:p<0?"#000000":"#FFFFFF").slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF;
    return "#"+(0x1000000+(u(((t>>16)-R1)*n)+R1)*0x10000+(u(((t>>8&0x00FF)-G1)*n)+G1)*0x100+(u(((t&0x0000FF)-B1)*n)+B1)).toString(16).slice(1)
  }
}

function light_color(color) {
  switch (color) {
    case "#FF0000": return "#FF2020";
    case "#FF1473": return "#FF3493";
    case "#00FF00": return "#20FF20";
    case "#AA3377": return "#CA5397";
    case "#7799FF": return "#97B9FF";
    case "#0000FF": return "#2020FF";
    case "#888888": return "#989898";
    default: return "#888888";
  }
}
function group_color(group) {
  switch (group) {
    case "GDR": return "#FF0000";
    case "SRC": return "#FF1473";
    case "ECOLO": return "#00FF00";
    case "RRDP": return "#AA3377";
    case "UDI": return "#7799FF";
    case "UMP": return "#0000FF";
    case "NI": return "#888888";
    default: return "#555555";
  }
}

function load_data(s, places) {
  $('#menu').hide();
  $('#loader').show();
  $('#layout').removeClass('running');
  $('#layout').addClass('hemicycle');
  $('#layout').text('Cosignatures');
  if (s.isForceAtlas2Running()) {
    s.killForceAtlas2();
  }
  s.graph.clear();
  s.refresh();
  var g = {nodes: [], edges: []};
  var loi = $('#loi :selected').val();
  $.getJSON("data/"+loi+".json", function(data) {
    var gpes = {};
    // TODO lighten data => separate parl as json / links as csv
    for (var parl in data['parlementaires']) {
      var place = data['parlementaires'][parl]['p'] || 300;
      var gpe = data['parlementaires'][parl]['g'] || null;
      g.nodes.push({
        id: 'd'+parl,
        label: data['parlementaires'][parl]['n'],
        x: places[place]['x']-285,
        hemx: places[place]['x']-285,
        y: places[place]['y']+150,
        hemy: places[place]['y']+150,
        size: Math.sqrt(data['parlementaires'][parl]['a']),
        color: group_color(gpe),
        color0: group_color(gpe),
        slug: data['parlementaires'][parl]['s']
      });
      if (gpe) {
        if (gpes[gpe]) {
          gpes[gpe].map(function(dep) {
            g.edges.push({
              id: gpe+'_'+parl+"-"+dep,
              source: "d"+parl,
              target: "d"+dep,
              size: 0,
              weight: 0.1,
              hidden: true,
              internal: true
            });
          });
        } else {
          gpes[gpe] = [];
        }
        gpes[gpe].push(parl);
      }
    }
    var links = {};
    data['links'].map(function(link) {
      var lid = link['1']+"-"+link['2'];
      if (!links[lid]) {
        links[lid] = {'1': "d"+link['1'], '2': "d"+link['2'], 'w': 0};
      }
      links[lid]['w'] += link['w'];
    });
    for(var link in links) {
      g.edges.push({
        id: link,
        source: links[link]['1'],
        target: links[link]['2'],
        color: '#ccc',
        weight: links[link]['w']
      });
    }
    s.graph.read(g);

    var popUp;
    function showNodeInfo(event) {
      var node = event.data.node;
      var toKeep = s.graph.neighbors(node.id);
      toKeep[node.id] = node;
      s.graph.nodes().forEach(function(n) {
        if (n.id == node.id)
          n.color = n.color0;
        else if (toKeep[n.id])
          n.color = shadeBlend(0.3, n.color0);
        else n.hidden = true;
      });
      s.graph.edges().forEach(function(e) {
        if (!e.internal &&
            (e.source == node.id && toKeep[e.source]) ||
            (e.target == node.id && toKeep[e.target])) {
          e.color = shadeBlend(0.7, node.color0);
        } else e.hidden = true;
      });
      s.refresh();
  
      popUp && popUp.remove();
      popUp = $(
        '<img src="http://www.nosdeputes.fr/depute/photo/'+node.slug+'/45" style="float:right;"/>'
      ).attr(
        'id',
        'node-info'
      ).css({
        'display': 'inline-block',
        'width': 55,
        'height': 70,
        'border-radius': 3,
        'padding': 5,
        'background': '#fff',
        'color': '#000',
        'box-shadow': '0 0 4px #666',
        'position': 'absolute',
        'left': node['cam0:x']-25,
        'top': node['cam0:y']+15
      });
      $('img',popUp).css('margin','0 0 0 20px');
      $('#sigma').append(popUp);
    }
    function hideNodeInfo(event) {
      s.graph.nodes().forEach(function(n) {
        n.color = n.color0;
        n.hidden = false;
      });
      s.graph.edges().forEach(function(e) {
        if (!e.internal) {
          e.color = '#ccc';
          e.hidden = false;
        }
      });
      s.refresh();
  
      popUp && popUp.remove();
      popUp = false;
    }
    s.bind('overNode', showNodeInfo).bind('outNode', hideNodeInfo);

    s.refresh();
    $('#loader').hide();
    setTimeout(function(){
      s.startForceAtlas2({
        edgeWeightInfluence: 0.8,
        strongGravityMode: true,
        gravity: 0.15,
        scalingRatio: 100000,
        slowDown: 2
      });
      $('#menu').show();
      setTimeout(function(){s.killForceAtlas2();}, 5000);
    }, 10);
  });
};
 
function init() {
  var places = {};
  var s = new sigma('sigma', {
    settings: {
      clone: false,
      immutable: false,
      nodesPowRatio: 0.25,
      edgesPowRatio: 1,
      zoomMin: 0.01,
      zoomMax: 4,
      singleHover: true,
      defaultLabelColor: '#333',
    }
  });
  $.getJSON("data/places.json", function(places) {
    load_data(s, places);
    $('#loi').change(function(){
      load_data(s, places);
    });
    $('#layout').click(function(){
      if ($('#layout').hasClass('running'))
        return;
      $('#layout').addClass('running');
      $('#menu').hide();
      var prefix = ($('#layout').hasClass('hemicycle') ? 'fa2' : 'hem');
      sigma.plugins.animate(s, {
        x: prefix + 'x',
        y: prefix + 'y'
      }, {
        duration: 1500,
        onComplete: function(){
          if ($('#layout').hasClass('hemicycle')) {
            $('#layout').removeClass('hemicycle');
            $('#layout').text('Hémicycle');
          } else {
            $('#layout').addClass('hemicycle');
            $('#layout').text('Cosignatures');
          }
          $('#layout').removeClass('running');
          $('#menu').show();
        }
      });
    });
  });
}

if (document.addEventListener) {
  document.addEventListener('DOMContentLoaded', init, false);
} else {
  window.onload = init;
}

