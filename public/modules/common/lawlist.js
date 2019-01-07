'use strict';

angular.module('theLawFactory')
.directive('lawlist', ['$location', '$rootScope', 'api',
function ($location, $rootScope, api) {
    return {
        restrict: 'A',
        replace: false,
        link: function postLink(scope) {
            function update() {
                api.getLawlist().then(function (data) {
                    // Process data to a list of law object
                    // with properties' names set by headers
                    var rows = data.split(/[\r\n]+/).filter(function(x) { return x.trim(); }),
                    headers = rows.splice(0, 1)[0].split(";").map(function (x) {
                        return x.replace(/(^"|"$)/g, '')
                    }),
                    laws = $.map(rows, function (row) {
                        var law = {}, lawdata = row.split(';').map(function (x) {
                            return x.replace(/(^"|"$)/g, '')
                        });
                        $.each(headers, function (i, header) {
                            law[header] = lawdata[i];
                        });
                        law.searchable = thelawfactory.utils.searchableLaw(law);
                        return law;
                    }).sort(function (a, b) {
                        return b["Date de promulgation"] > a["Date de promulgation"];
                    });

                    $rootScope.lawlist = laws;

                    $("#search").mouseenter(function () {
                        $(".form-law").css('opacity', 1);
                    }).mouseleave(function () {
                        $(".form-law").css('opacity', 0.3);
                    }).autocomplete({
                        source: function (request, response) {
                            if (request.term.length < 3) return response([]);
                            var matcher = new RegExp($.ui.autocomplete.escapeRegex(thelawfactory.utils.clean_accents(request.term)), "i");
                            response($.map($.grep(laws, function (value) { return matcher.test(value.searchable); }), function (n) {
                                return {
                                    "label": (n.short_title || "").replace(/ \([^)]*\)/g, '') + " (" + (n.loi_dite ? n.loi_dite + " : " : "") + n.Titre + ")",
                                    "value": n.id,
                                    "themes": n["Thèmes"],
                                    "amendements": n.total_amendements,
                                    "words": n.total_mots,
                                    "dates": n["Date initiale"] + (n["Date de promulgation"] ? (" → " + n["Date de promulgation"]) : " → en cours")
                                }
                            }).sort(function(l1, l2){
                                if (l1.dates < l2.dates) return 1;
                                if (l2.dates < l1.dates) return -1;
                                if (l1.label.toLowerCase() < l2.label.toLowerCase()) return -1;
                                if (l2.label.toLowerCase() < l1.label.toLowerCase()) return 1;
                                return 0;
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
                                $location.path(($location.path() === '/lois.html' ? 'loi' : 'article') + "s.html");
                                $location.search("loi=" + ui.item.value);
                                $(".form-law").css('opacity', 0.3);
                                $('#navbar-form .message').text('');
                            });
                        },
                        messages: {
                            noResults: function () {
                                var msg = 'Aucune loi trouvée';
                                $('#navbar-form .message').text(msg);
                                return msg;
                            },
                            results: function (d) {
                                var msg = d + " loi" + (d > 1 ? "s trouvées" : " trouvée");
                                $('#navbar-form .message').text(msg);
                                return msg;
                            }
                        }
                    })
                    .data("ui-autocomplete")._renderItem = function (ul, item) {
                        var themesdiv = $("<div>");
                        (item.themes || "").split(',').forEach(function (e) {
                            themesdiv.append("<span class='glyphicon glyphicon-tag'></span> " + e.toLowerCase() + " ");
                        });

                        var icodiv = $("<div class='src-ico'>")
                            .append('<div><span class="glyphicon glyphicon-calendar"></span> ' + item.dates + "</div>")
                            .append('<div title="' + item.amendements + ' amendements déposés sur ce texte" class="search" data-toggle="tooltip" data-placement="bottom"><span class="glyphicon glyphicon-folder-open" style="opacity: ' + thelawfactory.utils.opacity_amdts(item.amendements) + '"></span> ' + item.amendements + "</div>")
                            .append('<div title="' + item.words + ' mots prononcés lors des débats sur ce texte" class="search" data-toggle="tooltip" data-placement="bottom"><span class="glyphicon glyphicon-comment" style="opacity: ' + thelawfactory.utils.opacity_mots(item.words) + '"></span> ' + 1000 * (Math.round(item.words / 1000.)) + "</div>")
                            .append(themesdiv);
                        $(".search").tooltip({ container: 'body' });

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
