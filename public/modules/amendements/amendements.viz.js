(function() {

    var thelawfactory = window.thelawfactory || (window.thelawfactory = {});

    // Sizes in pixels
    var amendmentSize = 20;
    var subjectHMargin = 50;
    var scrollbarWidth;

    // Available size in number of amendments
    var availableWidth;

    // Max number of amendments amongst all subjects
    var maxAmendments = 0;

    // Political groups
    var groupes;

    // Amendment status helpers
    var sort_ordre = {
        "adopté": 0,
        "rejeté": 1,
        "non-voté": 2,
        "en attente": 3
    }, sort_image = {
        "adopté": "img/ok.png",
        "rejeté": "img/ko.png",
        "non-voté": "img/nd.png",
        "en attente": "img/at.png"
    }, tri = {
        "sort": tri_amdts_sort,
        "groupe": tri_amdts_groupe
    };

    // Helper functions
    function cssColor(col)              { return thelawfactory.utils.adjustColor(col).toString(); }
    function compare_sujets(a, b)       { return a.order - b.order; }
    function compare_groupes(a, b)      { return groupes[a].order - groupes[b].order; }
    function compare_amdts_sort(a, b)   { return sort_ordre[a.sort] - sort_ordre[b.sort]; }
    function compare_amdts_groupe(a, b) { return groupes[a.groupe].order - groupes[b.groupe].order; }
    function compare_amdts_numero(a, b) { return a.numero.replace(/^\D+/, '') - b.numero.replace(/^\D+/, ''); }
    function tri_amdts_sort(a, b)       { return compare_amdts_sort(a, b) || compare_amdts_groupe(a, b) || compare_amdts_numero(a, b); }
    function tri_amdts_groupe(a, b)     { return compare_amdts_groupe(a, b) || compare_amdts_sort(a, b) || compare_amdts_numero(a, b); }

    // Column allocation inside a subject
    function allocateAmendments(sujet) {
        var amendements = sujet.amendements;
        var snake = sujets.amendements_snake = [];
        var nb = sujet.amendements.length;

        if (nb < availableWidth) {
            // Single line, as many columns as amendments
            sujet.height = amendmentSize;
            sujet.amendements_snake = sujet.amendements;
        } else {
            // Multiline, allocate amendments top to bottom, left to right
            var nlignes = Math.ceil(nb / availableWidth);
            var ncolonnes = Math.ceil(nb / nlignes);
            sujet.height = nlignes * amendmentSize;

            amendements.forEach(function(a, index) {
                var col = Math.floor(index / nlignes);
                var row = index - col * nlignes;
                if (col % 2 === 1) row = nlignes - row - 1;
                snake[nlignes * col + row] = a;
            });
        }
    }


    thelawfactory.amendements = {
        // Computes available width in amendments
        measureViewportSize: function() {
            if (typeof scrollbarWidth === 'undefined') {
                scrollbarWidth = $('#probe').width() - $('#probe #inside').width();
            }

            var viewportWidth = $('#viz').width() - scrollbarWidth;
            availableWidth = Math.floor((viewportWidth - subjectHMargin) / amendmentSize);
        },

        // Transforms data from api format to something usable by the angular template
        // If onlyReallocate is truthy, only column allocation is performed
        transformData: function(scope, onlyReallocate) {
            var apiData = scope.apiData;
            var tri_amdts = tri[scope.sortOrder] || compare_amdts_numero;
            var en_attente = false;
            var data;

            if (!onlyReallocate) {
                groupes = apiData.groupes;

                data = {
                    groupes: groupes,
                    legende: {
                        groupes: {},
                        sorts: {}
                    },
                    sujets: [],
                    colonnes: ''
                };

                if (scope.groupAll) {
                    // Create single subject when in group mode
                    data.sujets.push({
                        titre: "Tout le texte",
                        amendements: []
                    });
                }

                // Loop over subjects
                Object.keys(apiData.sujets)
                .forEach(function(key) {
                    var sujet = apiData.sujets[key];

                    // Extract article number
                    sujet.article = sujet.details.replace(/^article /, '');

                    // Add status image, group color and group name to amendments
                    sujet.amendements.forEach(function(amdt) {
                        amdt.sort_image = sort_image[amdt.sort];
                        amdt.color = cssColor(groupes[amdt.groupe].color);
                        amdt.nom_groupe = groupes[amdt.groupe].nom;

                        if (amdt.sort === 'en attente') {
                            en_attente = true;
                        }
                    });

                    if (scope.groupAll) {
                        // Group all amendments
                        data.sujets[0].amendements = data.sujets[0].amendements.concat(sujet.amendements);
                    } else {
                        // Sort amendments in the subject
                        sujet.amendements.sort(tri_amdts);

                        // Append subject to subject list
                        data.sujets.push(sujet);

                        // Update max amendment count
                        maxAmendments = Math.max(maxAmendments, sujet.amendements.length);
                    }
                });

                if (scope.groupAll) {
                    // Sort amendments in global subject
                    data.sujets[0].amendements.sort(tri_amdts);
                } else {
                    // Sort subjects
                    data.sujets.sort(compare_sujets);
                }

                // Build legend contents
                Object.keys(groupes).sort(compare_groupes).forEach(function(key) {
                    groupes[key].cssColor = cssColor(groupes[key].color);

                    if (key !== 'Gouvernement') {
                        data.legende.groupes[key] = groupes[key];
                    }
                });

                Object.keys(sort_image).forEach(function(sort) {
                    if (en_attente || sort !== 'en attente') {
                        data.legende.sorts[sort] = sort_image[sort];
                    }
                });
            } else {
                data = scope.data;
            }

            data.sujets.forEach(function(s) {
                allocateAmendments(s);
            });

            scope.twoColumnMode = (availableWidth > maxAmendments * 2 + 1);
            scope.data = data;
        }
    };

}());