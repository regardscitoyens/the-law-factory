angular.module('theLawFactory.lawlist', [])
    .directive('lawlist', ['$location', '$rootScope', 'api', function ($location, $rootScope, api) {
            return {
                restrict: 'A',
                replace: false,
                link: function postLink(scope) {
                    function update() {
                        api.getLawlist().then(function (data) {
                            scope.ll = data;
                            // Process data to a list of law object
                            // with properties' names set by headers
                            var headers, laws, rows = scope.ll.split(/\r\n|\n/);
                            headers = rows.splice(0, 1)[0].split(";").map(function (x) {
                                return x.replace(/(^"|"$)/g, '')
                            });
                            laws = $.map(rows, function (row) {
                                var law = {}, lawdata = row.split(';').map(function (x) {
                                    return x.replace(/(^"|"$)/g, '')
                                });
                                $.each(headers, function (i, header) {
                                    law[header] = lawdata[i];
                                });
                                return law;
                            });

                            $rootScope.lawlist = laws;

                            $("#search").mouseenter(function () {
                                $(".form-law").css('opacity', 1);
                            }).mouseleave(function () {
                                $(".form-law").css('opacity', 0.3);
                            }).autocomplete({
                                source: function (request, response) {
                                    var matcher = new RegExp($.ui.autocomplete.escapeRegex(thelawfactory.utils.clean_accents(request.term)), "i");
                                    response($.map($.grep(laws.sort(function (a, b) {
                                        return b["Date de promulgation"] > a["Date de promulgation"];
                                    }), function (value) {
                                        value = thelawfactory.utils.clean_accents(value.Titre + " " + value.id + " " + value["Thèmes"] + " " + value.short_title);
                                        return matcher.test(thelawfactory.utils.clean_accents(value));
                                    }), function (n) {
                                        return {
                                            "label": n.short_title.replace(/ \([^)]*\)/g, '') + " (" + n.Titre + ")",
                                            "value": n.id,
                                            "themes": n["Thèmes"],
                                            "amendements": n.total_amendements,
                                            "words": n.total_mots,
                                            "dates": n["Date initiale"] + (n["Date de promulgation"] ? " → " + n["Date de promulgation"] : "")
                                        }
                                    }));
                                },
                                focus: function (event, ui) {
                                    $(".form-law").css('opacity', 1);
                                    event.preventDefault();
                                    $(".src-fcs").removeClass("src-fcs");
                                    $("." + ui.item.value).addClass("src-fcs");
                                },
                                open: function () {
                                    $(".form-law").css('opacity', 1);
                                    var h = $(".ui-autocomplete").position().top;
                                    $(".ui-autocomplete").css({
                                        'max-height': $(window).height() - h - 100,
                                        'overflow-y': 'scroll'
                                    });
                                },
                                close: function () {
                                    $(".form-law").css('opacity', 0.3);
                                    $('#header-search .message').text('');
                                },
                                appendTo: ".lawlist",
                                select: function (event, ui) {
                                    $rootScope.$apply(function () {
                                        $("body").css("overflow", "auto");
                                        $location.path(($location.path() === '/lois.html' ? 'loi' : 'article') + "s.html");
                                        $location.search("loi=" + ui.item.value);
                                        $(".form-law").css('opacity', 0.3);
                                    });
                                },
                                messages: {
                                    noResults: function () {
                                        var msg = 'Aucune loi trouvée';
                                        $('#header-search .message').text(msg);
                                        return msg;
                                    },
                                    results: function (d) {
                                        var msg = d + " loi" + (d > 1 ? "s trouvées" : " trouvée");
                                        $('#header-search .message').text(msg);
                                        return msg;
                                    }
                                }
                            })
                                .data("ui-autocomplete")._renderItem = function (ul, item) {
                                var themesdiv = $("<div>");
                                item.themes.replace(/ et /g, ', ').split(', ').forEach(function (e) {
                                    themesdiv.append("<span class='glyphicon glyphicon-tag'></span> " + e.toLowerCase() + " ");
                                });

                                var icodiv = $("<div class='src-ico'>")
                                    .append('<div><span class="glyphicon glyphicon-calendar"></span> ' + item.dates + "</div>")
                                    .append('<div title="' + item.amendements + ' amendements déposés sur ce texte" class="search" data-toggle="tooltip" data-placement="bottom"><span class="glyphicon glyphicon-folder-open" style="opacity: ' + thelawfactory.utils.opacity_amdts(item.amendements) + '"></span> ' + item.amendements + "</div>")
                                    .append('<div title="' + item.words + ' mots prononcés lors des débats sur ce texte" class="search" data-toggle="tooltip" data-placement="bottom"><span class="glyphicon glyphicon-comment" style="opacity: ' + thelawfactory.utils.opacity_mots(item.words) + '"></span> ' + 1000 * (Math.round(item.words / 1000.)) + "</div>")
                                    .append(themesdiv);
                                $(".search").tooltip();

                                var txtdiv = $("<div class='src-txt'>")
                                    .append("<a>" + item.label + "</a>")
                                    .append(icodiv);

                                return $("<li class=" + item.value + ">")
                                    .append(txtdiv)
                                    .appendTo(ul);
                            };
                        }, function () {
                            scope.display_error("impossible de trouver les données de recherche sur les textes");
                        })
                    }

                    update();
                }
            }
        }]);