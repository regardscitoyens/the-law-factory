(function(){
	var thelawfactory = window.thelawfactory || (window.thelawfactory = {});

	var sort_ordre = {"adopté": 0, "rejeté": 1, "non-voté": 2, "en attente": 3};
	var sort_image = {"adopté": "img/ok.png", "rejeté": "img/ko.png", "non-voté": "img/nd.png", "en attente": ""};
	var api_root;

	// Adapte les données des amendements pour affichage par le template mod2.html
	thelawfactory.amendements = function() {
		function mapper(rawData) {
			var data = {
				sujets: [],
				groupes: rawData.groupes,
				legende: {
					groupes: {},
					sorts: {}
				}
			};

			api_root = rawData.api_root_url.replace(/^https?:/, '');

			// Fonctions de tri

			function compare_sujets(a, b) {
				return rawData.sujets[a].order - rawData.sujets[b].order;
			}

			function compare_amdts_sort(a, b) {
				return sort_ordre[a.sort] - sort_ordre[b.sort];
			}

			function compare_amdts_groupe(a, b) {
				return rawData.groupes[a.groupe].order - rawData.groupes[b.groupe].order;
			}

			function tri_amdts_sort(a, b) {
				return compare_amdts_sort(a, b) || compare_amdts_groupe(a, b);
			}

			function tri_amdts_groupe(a, b) {
				return compare_amdts_groupe(a, b) || compare_amdts_sort(a, b);
			}

			// Tri des sujets
			Object.keys(rawData.sujets).sort(compare_sujets)

			// Parcours de sujets
			.forEach(function(key) {
				var sujet = rawData.sujets[key];

				// Amendements triés par sort et par groupe
				sujet.amdts_sort = sujet.amendements.sort(tri_amdts_sort);
				sujet.amdts_groupe = sujet.amendements.sort(tri_amdts_groupe);

				// Ajout des données nécessaires aux amendements
				sujet.amendements.forEach(function(amdt) {
					amdt.sort_image = sort_image[amdt.sort];
					if (rawData.groupes[amdt.groupe])
						amdt.color = rawData.groupes[amdt.groupe].color;
					else
						amdt.color = "#e6e6e6";
				});

				data.sujets.push(sujet);
			});

			// Legende
			Object.keys(rawData.groupes).forEach(function(key) {
				if (key !== 'Gouvernement') {
					data.legende.groupes[key] = rawData.groupes[key];
				}
			})
			Object.keys(sort_image).forEach(function(key) {
				if (key !== 'en attente') {
					data.legende.sorts[key] = sort_image[key];
				}
			})

			return data;
		};

		return mapper;
	};

	// Focus sur un sujet
	thelawfactory.amendements.focus = function(elem) {
		$sujet = $(elem).parent('.sujet');
		$viz = $sujet.parent('#viz');

		if ($sujet.hasClass('focus')) {
			$sujet.removeClass('focus');
			$viz.removeClass('focus-mode');
		} else {
			$viz.find('.focus').removeClass('focus');
			$viz.addClass('focus-mode');
			$sujet.addClass('focus');
		}
	};

	// Selection d'un amendement
	thelawfactory.amendements.select = function(elem, d) {
		var utils = $('.mod2').scope();

		$('.mod2 .selected').removeClass('selected');
		$(elem).addClass('selected');

        $("#readMode").show();
        $("#text-title").text("Amendement " + d.numero);
        $(".text-container").empty();
        utils.setTextContainerHeight();
        utils.startSpinner('load_amd');

        setTimeout(function(){ d3.json(api_root + d.id_api + '/json?'+new Date(),function(error, json){
            var currAmd = json.amendement,
                source_am = '.fr</a> &nbsp; &nbsp; <a href="'+currAmd.source+'" target="_blank"><span class="glyphicon glyphicon-link"></span>',
                statico = sort_image[d.sort],
                col = utils.adjustColor(d.color).toString();
            if (currAmd.url_nosdeputes) source_am = currAmd.url_nosdeputes+'"><span class="glyphicon glyphicon-link"></span> NosDéputés'+source_am+'Assemblée nationale';
            else if(currAmd.url_nossenateurs) source_am = currAmd.url_nossenateurs+'"><span class="glyphicon glyphicon-link"></span> NosSénateurs'+source_am+'Sénat';
            $(".text-container").html(
                '<span class="amd-date">' + d3.time.format("%d/%m/%Y")(d3.time.format("%Y-%m-%d").parse(d.date)) + "</span>" +
                '<span class="amd-sort">' + currAmd.sort + " <span class='amd-txt-status' style='background-color:"+col+"'><img style='margin:0; padding:4px; width:18px;' src='"+statico+"'/></span> </span>" +
                '<div class="amd-subject"><b>Sujet :</b><span> ' + utils.clean_amd_subject(currAmd.sujet)+"</span></div>" +
                '<div class="amd-text"><b>Signataires :</b> <span>' + currAmd.signataires+"</span></div>" +
                '<div class="amd-text"><b>Exposé des motifs :</b> ' + currAmd.expose + "</div>" +
                '<div class="amd-text"><b>Texte :</b> ' + currAmd.texte + '</div>' +
                '<p class="sources"><small><a target="_blank" href="' + source_am + '</a></small></p>'
            );
            utils.stopSpinner(function() {
                $(".text-container").animate({opacity: 1}, 350);
                $('.text-container').scrollTop(0);
            }, 'load_amd');
        });}, 50);
	}

	// Redimensionnement des conteneurs
	thelawfactory.amendements.resize = function() {
		var utils = $('.mod2').scope();

        utils.setMod2Size();
        utils.setTextContainerHeight();
	}
})();