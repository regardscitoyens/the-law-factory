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

function group_color(group) {
  switch (group) {
    case "GDR": return "rgb(255,30,30)";
    case "SRC": return "rgb(255,50,190)";
    case "ECOLO": return "rgb(0,230,30)";
    case "RRDP": return "rgb(250,195,132)";
    case "UDI": return "rgb(30,180,255)";
    case "UMP": return "rgb(30,30,200)";
    case "NI": return "rgb(100,100,100)";
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
  $('#recenter').click();
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
        color:  shadeBlend(0.2, group_color(gpe)),
        color0: shadeBlend(0.2, group_color(gpe)),
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
              weight: 0.1/gpes[gpe].length,
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
        'left': (node['cam0:x'] || node['renderer1:x']) - 25,
        'top':  (node['cam0:y'] || node['renderer1:y']) + 15
      });
      $('img',popUp).css('margin','0 0 0 20px');
      $('#sigma').append(popUp);
    }
    function hideNodeInfo(event) {
      popUp && popUp.remove();
      popUp = false;
    }
    s.bind('overNode', showNodeInfo).bind('outNode', hideNodeInfo);

    var selected = null;
    function clickNode(event) {
      var node = event.data.node;
      var bol = (selected == node.id);
      if (selected) unclickNode(event, !bol);
      if (bol) return;
      if (!selected) {
        $("#menu").hide();
        $("#loader").show();
      }
      setTimeout(function(){
        selected = node.id;
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
            e.color = shadeBlend(0.5, node.color0);
          } else e.hidden = true;
        });
        s.refresh();
        setTimeout(function() {
          $("#loader").hide();
          $("#menu").show();
        }, 0);
      }, 0);
    }
    function unclickNode(event, keepLoadBar) {
      if (!selected) return;
      selected = null;
      $("#menu").hide();
      $("#loader").show();
      setTimeout(function(){
        s.graph.nodes().forEach(function(n) {
          n.color = n.color0;
          n.hidden = false;
          n.selected = false;
        });
        s.graph.edges().forEach(function(e) {
          if (!e.internal) {
            e.color = '#ccc';
            e.hidden = false;
          }
        });
        s.refresh();
        if (!keepLoadBar) {
          setTimeout(function() {
            $("#loader").hide();
            $("#menu").show();
          }, 0);
        }
      }, 0);
    }
    s.bind('clickNode', clickNode).bind('clickStage', unclickNode);

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
    }, 0);
  });
};
 
function init() {
  var places = {};
  var s = new sigma({
    container: 'sigma',
    settings: {
      clone: false,
      immutable: false,
      nodesPowRatio: 0.25,
      edgesPowRatio: 1,
      zoomMin: 0.01,
      zoomMax: 4,
      singleHover: true,
    //  drawEdges: false,
      defaultLabelColor: '#333'
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
      $('#recenter').click();
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
          //  s.settings({drawEdges: true}).refresh();
            $('#layout').removeClass('hemicycle');
            $('#layout').text('Hémicycle');
          } else {
            $('#layout').addClass('hemicycle');
            $('#layout').text('Cosignatures');
          //  s.settings({drawEdges: false}).refresh();
          }
          $('#layout').removeClass('running');
          $('#menu').show();
        }
      });
    });
    $('#zoom').click(function() {
      sigma.misc.animation.camera(
        s.camera,
        {ratio: s.camera.ratio / 1.5 },
        {duration: 150 }
      );
    });
    $('#unzoom').click(function() {
      sigma.misc.animation.camera(
        s.camera,
        {ratio: s.camera.ratio * 1.5 },
        {duration: 150 }
      );
    });
    $('#recenter').click(function() {
      sigma.misc.animation.camera(
        s.camera,
        {x: 0, y: 0, ratio: 1},
        {duration: 250, easing: 'cubicInOut'}
      );
    });
  });
}

if (document.addEventListener) {
  document.addEventListener('DOMContentLoaded', init, false);
} else {
  window.onload = init;
}

