var orderedByStatus = true;
var sortByStat;
var sortByParty;
var redraw;
var grouped=null;
var api_root;
var utils, highlight;

(function(){

  var thelawfactory = window.thelawfactory || (window.thelawfactory = {});

  thelawfactory.mod2 = function(){

    function get_status_img(e){
        if (e.sort==="adopté") return "img/ok.png";
        if (e.sort==="rejeté") return "img/ko.png";
        if (e.sort==="non-voté") return "img/nd.png";
    }

  	function vis(selection){

		var articles;
        utils = $('.mod2').scope();
        highlight = utils.highlightGroup;
        selection.each(function(d,i){
            utils.groups = d.groupes;
            articles=d.sujets;
            api_root=d.api_root_url;
        });
        if (Object.keys(articles).length < 2)
            $('#display_menu').parent().hide();

        selectRow = function(art,pos) {
            if(d3.event) d3.event.stopPropagation();
            var sel = d3.select("."+utils.slugArticle(art));
            if(!sel.empty()) {
                utils.resetHighlight('amds');
                d3.selectAll("g").style("opacity", 0.2);
                sel.style("opacity", 1);
                if(pos) $("#viz").animate({ scrollTop: sel.attr("data-offset") })
            }
        };

        deselectRow = function() {
            if(d3.event) d3.event.stopPropagation();
            utils.resetHighlight('amds');
            $("#readMode").hide();
            d3.selectAll("g").style("opacity", 1);
        };

        artArray=d3.values(articles).sort(function(a,b){return a.order-b.order});

        var w, rw, minheight, nsq, z,
		    lineh = 30,
            x = 0, y, h,
            jumpLines = 0,
		    offset = 0;
        var readSizes = function() {
            rw = $("#viz").width();
            w = rw - 30;
            minheight = $("#viz").height() - 5;
		    z = 20;
		    nsq = Math.round((w-40) / z);
		    h = lineh*artArray.length+40;
		    y = h / z;
        };
        readSizes();
		var svg = d3.select("#viz").append("svg")
		    .attr("width", rw)
		    .attr("height", Math.max(minheight, h))
            .on("click",deselectRow);

        var compare_partys = function(a,b){
                if (utils.groups[a].order < utils.groups[b].order) return -1;
                if (utils.groups[a].order > utils.groups[b].order) return 1;
            },
            statsorder = {"adopté": 0, "rejeté": 1, "non-voté": 2},
            compare_stats = function(a,b){
                if (statsorder[a] < statsorder[b]) return -1;
                if (statsorder[a] > statsorder[b]) return 1;
            },
            compare_by_party = function(a,b){
                if (a.groupe != b.groupe) return compare_partys(a.groupe, b.groupe);
                if (a.sort != b.sort) return compare_stats(a.sort, b.sort);
                return a.numero - b.numero;
            },
            compare_by_stat = function(a,b){
                if (a.sort != b.sort) return compare_stats(a.sort, b.sort);
                if (a.groupe != b.groupe) return compare_partys(a.groupe, b.groupe);
                return a.numero - b.numero;
            },
            check_half = function(g) {
                var half_col=false;
                var maxlen;
                if(!g) maxlen = d3.max(artArray,function(d){return d.amendements.length});
                else maxlen = grouped.amendements.length;

                if(maxlen<nsq/2) {
                    x=nsq/2-1;
                    half_col=true;
                }
                else x = nsq;
                return half_col;
            };

        sortByStat = function() {
            $("#display_order .chosen").removeClass('chosen');
            $("#display_order #do-stat").addClass('chosen');
            $("#menu-order .selectedchoice").text('sort final');
            orderedByStatus = true;
            redraw();
        };

        sortByParty = function() {
            $("#display_order .chosen").removeClass('chosen');
            $("#display_order #do-party").addClass('chosen');
            $("#menu-order .selectedchoice").text('groupe politique');
            orderedByStatus = false;
            redraw();
        };
        redraw = function(merged) {
            readSizes();
            if (merged == undefined) merged = grouped;
            $('#menu-display .selectedchoice').text(merged ? 'groupée' : 'par articles');
            utils.startSpinner();
            $("svg").animate({opacity: 0}, 200, function() {
                $("svg").empty();
                $(".text-container").empty();
                jumpLines=0;
                (merged ? drawMerged() : draw());
                var a = d3.select("svg").select("g:last-child").attr("data-offset"),
                   ah = d3.select("svg").select("g:last-child").node().getBBox().height;
                svg.attr("height",Math.max(minheight, z+parseInt(a)+ah));
                if (utils.article!=null)
                    selectRow(utils.article, true);
                utils.stopSpinner(function() {
                    $("svg").animate({opacity: 1}, 500);
                });
            });
        }

        function draw() {
            $("#display_menu .chosen").removeClass('chosen');
            $("#display_menu #dm-draw").addClass('chosen');
            grouped=null;
            artArray.forEach(function(d,i) {
                d['amendements'].sort((orderedByStatus ? compare_by_stat : compare_by_party));
            });

            var half_col=check_half();
            artArray.forEach(function (d, i) {
                drawLines(d, i, half_col)
            });
        }

        function drawMerged() {
            $("#display_menu .chosen").removeClass('chosen');
            $("#display_menu #dm-merged").addClass('chosen');
            if(!grouped) {
                grouped = {titre:'Tous les amendements',key: 'all articles', amendements:[]}
                artArray.forEach(function(d,i) {
                    grouped.amendements=grouped.amendements.concat(d.amendements)
                });
            }

            var half_col=check_half(grouped);
            grouped['amendements'].sort((orderedByStatus ? compare_by_stat : compare_by_party));
            drawLines(grouped,0,half_col);
        }

        function drawLines(d,i, half) {

          var multi=false;
          len = d.amendements.length;
		  lines = Math.ceil(len/x);
          if(lines>1) {
              multi=true;
              lines += 1;
          }
              var k = Math.floor(i / 2);
              d.offset = offset;

              var curRow = svg.append("g")
                  .classed(utils.slugArticle(d.titre), true)
                  .attr("transform", function () {
                      if (!half) return "translate(" + 10 + "," + (i * 20 + i * lineh + 10 + jumpLines * (lineh - 10)) + ")";
                      else {
                          return "translate(" + (10 + (i % 2) * w / 2) + "," + (k * 20 + k * lineh + 10 + jumpLines * (lineh - 10)) + ")";
                      }
                  })
                  .attr("data-offset", function () {
                      if (!half) return i * 20 + i * lineh + 10 + jumpLines * (lineh - 10)
                      else return k * 20 + k * lineh + 10 + jumpLines * (lineh - 10);
                  })
                  .call(function () {
                    if(!multi) {
                        n = d.amendements.length;
                        offset = Math.floor(n / x)
                        jumpLines = jumpLines + offset;
                    }
                      else jumpLines+=lines-1;
                  });

              var bg = curRow
                  .selectAll(".bg")
                  .data(d3.range(x * lines))
                  .enter()

              bg.append("rect")
                  .attr("x", function (f) {
                      return (f % x) * z + 21
                  })
                  .attr("y", function (f) {
                      return Math.floor(f / x) * z + 21
                  })
                  .attr("width", z - 2)
                  .attr("height", z - 2)
                  .classed("bg", true)
                  .style("fill", "#F0F0F0")

              curRow.append("text")
                  .attr("x", 20)
                  .classed("row-txt", true)
                  .attr("y", 15)
                  .style("fill", "#716259")
                  .attr("font-size", "0.85em")
                  .text(d.titre)
                  .on("click", function () {
                      selectRow(d.titre, false);
                  });

              var popover = function (e) {
                  var date = e.date.split('-'),
                      div = d3.select(document.createElement("div")).style("width", "100%");
                  div.append("p").html("<b>" + utils.groups[e.groupe].nom + "</b>");
                  div.append("p").html("Sort : " + e.sort + "");
                  div.append("p").html("<small>" + [date[2], date[1], date[0]].join("/") + "</small>");
                  return {
                      title: "Amendement " + e.numero,
                      content: div,
                      placement: "mouse",
                      gravity: "right",
                      displacement: [10, -90],
                      mousemove: true
                  };
              }

              var amds = curRow
                  .selectAll(".amd")
                  .data(d.amendements)
                  .enter();
              amds.append("rect")
                  .attr("x", function (f, i) {
                      if(multi)  return Math.floor(i / lines) * z + 21;
                      else return (i % x) * z + 21
                  })
                  .attr("y", function (f, i) {
                      if(multi)  return Math.floor(Math.floor(i / lines) % 2 == 0 ? i % lines : lines - (i % lines) - 1) * z + 21;
                      return Math.floor(i / x) * z + 21
                  })
                  .attr("width", z - 2)
                  .attr("height", z - 2)
                  .attr("id", function (e) {
                      return "a_" + e.numero.replace(/[^a-z\d]/ig, '')
                  })
                  .attr("class", function(e) { return "amd " + utils.slugGroup(e.groupe) + " " + utils.slugGroup(e.sort); })
                  .style("fill", color_amd)
                  .style("opacity", 0.9)
                  .popover(popover)
                  .on("click", select);

              var imgs = curRow
                  .selectAll("image")
                  .data(d.amendements)
                  .enter();
              imgs.append("svg:image")
                  .attr("x", function (f, i) {
                      if(multi)  return Math.floor(i / lines) * z + 25;
                      else return (i % x) * z + 25
                  })
                  .attr("y", function (f, i) {
                      if(multi)  return Math.floor(Math.floor(i / lines) % 2 == 0 ? i % lines : lines - (i % lines) - 1) * z + 25;
                      return Math.floor(i / x) * z + 25
                  })
                  .attr("width", z - 10)
                  .attr("height", z - 10)
                  .attr("xlink:href", get_status_img)
                  .popover(popover)
                  .on("click", select);
        }

		function select(d) {
            d3.event.stopPropagation();
            $("#readMode").show();
            utils.resetHighlight('amds');
            $("#text-title").text("Amendement "+d.numero);
            utils.setTextContainerHeight();
            utils.startSpinner('load_amd');
            setTimeout(function(){ d3.json(api_root+d.id_api+'/json',function(error, json){
                var currAmd = json.amendement,
                    source_am = '.fr</a> &mdash; <a href="'+currAmd.source+'" target="_blank">',
                    statico = get_status_img(d),
                    col = color_amd(d);
                if (currAmd.url_nosdeputes) source_am = currAmd.url_nosdeputes+'">NosDéputés'+source_am+'Assemblée nationale';
                else if(currAmd.url_nossenateurs) source_am = currAmd.url_nossenateurs+'">NosSénateurs'+source_am+'Sénat';
                $(".text-container").html(
                    "<p><b>Date :</b> " + d3.time.format("%d/%m/%Y")(d3.time.format("%Y-%m-%d").parse(d.date)) + "</p>" +
                    "<p><b>Objet :</b> " + currAmd.sujet+"</p>" +
                    "<p><b>Signataires :</b> " + currAmd.signataires+"</p>" +
                    "<p><b>Sort :</b> " + currAmd.sort + " <span class='amd-txt-status' style='background-color:"+col+"'><img style='margin:0; padding:4px;' src='"+statico+"'/></span> </p>" +
                    "<p><b>Exposé des motifs :</b> " + currAmd.expose+"</p>" +
                    "<p><b>Texte :</b> " + currAmd.texte +
                    '<p><small><b>Sources :</b> <a target="_blank" href="' + source_am + "</a></small></p>"
                );
                utils.stopSpinner(function() {
                    $(".text-container").animate({opacity: 1}, 350);
                    $('.text-container').scrollTop(0);
                }, 'load_amd');
            });}, 50);
            d3.selectAll("#a_"+d.numero.replace(/[^a-z\d]/ig, ''))
                .classed("actv-amd", true)
                .style("opacity", 1)
                .style("stroke", "#333344")
                .style("stroke-width", 2);
		}

		function color_amd(d) {
			if(utils.groups[d.groupe]) {
				return utils.adjustColor(utils.groups[d.groupe].color).toString();
			} else return "#E6E6E6";
        }

        $(document).ready(function() {
            utils.drawGroupsLegend();
            $('.readMode').tooltip({ animated: 'fade', placement: 'bottom'});
            if ($(".others div").length) $(".others").append('<div class="leg-item"></div>');
            [
                {nom: 'Adopté', id: 'adopt', img: 'ok'},
                {nom: 'Rejeté', id: 'rejet', img: 'ko'},
                {nom: 'Non voté', id: 'nonvot', img: 'nd'}
            ].forEach(function(d) {
                var oncl = 'onclick="highlight(\''+d.id+'\')" title="Amendements '+d.nom.toLowerCase()+'s" data-toggle="tooltip" data-placement="left">';
                $(".others").append('<div class="leg-item"><div class="leg-value" style="background-color: rgb(180,180,180); background-image: url(img/'+d.img+'.png); background-repeat:no-repeat; background-position:50% 50%;"'+oncl+'</div><div class="leg-key"'+oncl+d.nom+'</div></div>');
            });
            $(".leg-value").tooltip();
            $(".leg-key").tooltip();
            redraw(false);
            $(window).resize(function(){
                if (utils.drawing) return;
                utils.drawing = true;
                setTimeout(function(){
                    utils.setMod2Size();
                    redraw(false);
                    utils.setTextContainerHeight();
                    utils.drawing = false;
                }, 500);
            });
        });

    }; //end function vis

    return vis;
  };

})();
