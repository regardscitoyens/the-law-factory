'use strict';

/* Directives */

angular.module('theLawFactory.directives', ['theLawFactory.config'])
    .directive('mod2', ['api', '$rootScope', '$location', '$compile',
        function (api, $rootScope) {
            return {
                restrict: 'A',
                replace: false,
                templateUrl: 'templates/mod2.html',
                controller: function ($scope) {
                    $scope.step = 0;
                    $scope.mod = "mod2";
                    $scope.helpText = "Chaque boîte représente un amendement dont le pictogramme indique le sort et la couleur le groupe politique de ses auteurs. Cliquez sur un amendement pour en lire le contenu et les détails.";
                    $scope.vizTitle = "AMENDEMENTS";
                },
                link: function postLink(scope, element, attrs) {
                    var mod2 = thelawfactory.mod2();

                    function update() {
                        thelawfactory.utils.startSpinner();

                        if (scope.etape != null) api.getAmendement(scope.loi, scope.etape).then(function (data) {
                            scope.data = data;
                            $rootScope.pageTitle = $rootScope.lawTitle + " - Amendements | ";
                            d3.select(element[0]).datum(data).call(mod2);
                        }, function (error) {
                            scope.display_error("impossible de trouver les amendements pour ce texte à cette étape");
                        });
                    }

                    update();
                }
            }
        }])
    .directive('mod2b', ['api', '$rootScope', '$location', '$compile',
        function (api, $rootScope, $location, $compile) {
            return {
                restrict: 'A',
                replace: false,
                templateUrl: 'templates/mod2b.html',
                controller: function ($scope) {
                    $scope.step = 0;
                    $scope.mod = "mod2b";
                    $scope.helpText = "Chaque boîte représente un groupe d'orateurs intervenus dans les débats sur un sujet. La longueur indique le nombre de mots prononcés et la couleur le groupe politique. Cliquez sur une boîte pour voir la liste des orateurs et consulter le texte des débats.";
                    $scope.vizTitle = "DÉBATS";
                },
                link: function postLink(scope) {

                    function update() {

                        thelawfactory.utils.startSpinner();

                        if (scope.etape != null) {

                            api.getIntervention(scope.loi).then(function (data) {
                                scope.data = data;
                                $rootScope.pageTitle = $rootScope.lawTitle + " - Débats | ";
                                init(data, scope.etape);
                            }, function (error) {
                                scope.display_error("impossible de trouver les interventions pour ce texte à cette étape");
                            })
                        }
                    }

                    update();
                }
            };
        }])
    .directive('mod0', ['api', '$rootScope', '$location', '$compile',
        function (api, $rootScope) {
            return {
                restrict: 'A',
                replace: false,
                templateUrl: 'templates/mod0.html',
                controller: function ($scope) {
                    $scope.mod = "mod0";
                    $scope.helpText = "Chaque ligne représente la chronologie des débats sur un projet ou une proposition de loi. La couleur indique l'institution en charge du texte à un instant donné (Assemblée en bleu, Sénat en rouge...). Cliquez sur un texte pour en consulter le résumé et en explorer les articles.";
                    $scope.vizTitle = "NAVETTES";
                },
                link: function postLink(scope, element) {

                    $rootScope.pageTitle = "";

                    $(".title").html('<h4 class="law-title">Explorer les textes promulgués depuis 2010</h4>');
                    $("#mod0-slider").slider({
                        min: 1,
                        max: 10,
                        animate: true,
                        value: 1,
                        slide: function (event, ui) {
                            thelawfactory.zooming(ui.value);
                        }
                    });

                    var mod0 = thelawfactory.mod0();

                    function update() {
                        thelawfactory.utils.startSpinner();
                        api.getDossiers().then(function (data) {
                            d3.select(element[0]).datum(data).call(mod0);
                        }, function (error) {
                            scope.display_error("impossible de trouver les données relatives aux textes");
                        });
                    }

                    update();

                }
            };
        }])
    .directive('lawlist', ['api', '$rootScope', "$log", "$location",
        function (api, $rootScope, $log, $location) {
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
                                    }), function (n, i) {
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
                                    noResults: function (d) {
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

                                item.themes.replace(/ et /g, ', ').split(', ').forEach(function (e, j) {
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

                        }, function (error) {
                            $log.error(error);
                            scope.display_error("impossible de trouver les données de recherche sur les textes");
                        })
                    }

                    update();
                }
            }
        }])
    .directive('movescroll', ['$rootScope', function ($rootScope) {
        return {
            restrict: 'A',
            controller: function ($scope, $element, $attrs) {
                $scope.pos = [-1, -1];
                $scope.xmouselerp = d3.scale.linear().range([-100, 0, 0, 100]).clamp(true);
                $scope.ymouselerp = d3.scale.linear().range([-100, 0, 0, 100]).clamp(true);
            },
            link: function postLink(scope, element, attrs, movescrollCtrl) {

                scope.xmouselerp.domain([0, element.width() * 0.2, element.width() * 0.8, element.width()]);
                scope.ymouselerp.domain([0, element.height() * 0.2, element.height() * 0.8, element.height()]);

                var clicking = false;
                var inpos = [-1, -1];
                // No dragging in the borders because of issues with the overflow scollbar
                var gantt_o = $('#gantt').offset(),
                    mouse_xmax = gantt_o.left + $('#gantt').width() - 20,
                    mouse_ymax = gantt_o.top + $('#gantt').height() - 20;

                element.mousedown(function (e) {
                    if (e.pageX > mouse_xmax || e.pageY > mouse_ymax)
                        return;
                    clicking = true;
                    inpos[0] = e.pageX;
                    inpos[1] = e.pageY;
                });

                $(document).mouseup(function () {
                    clicking = false;
                    inpos = [-1, -1];
                });

                element.mousemove(function (e) {
                    if (clicking == false) return;
                    e.stopPropagation();
                    var x = (e.pageX - inpos[0]) * 2;
                    var y = (e.pageY - inpos[1]) * 2;
                    element.scrollTop(element.scrollTop() - y);
                    element.scrollLeft(element.scrollLeft() - x);
                    inpos[0] = e.pageX;
                    inpos[1] = e.pageY;
                });
            }
        };
    }])
    .directive('about', ['$rootScope', '$location', '$compile',
        function ($rootScope) {
            return {
                restrict: 'A',
                replace: false,
                templateUrl: 'templates/about.html',
                controller: function ($scope) {
                    $rootScope.pageTitle = " À propos | ";
                    $scope.mod = "about";
                }
            }
        }])

    .directive('resizable', ['$window', function ($window) {
        return function ($scope) {
            $scope.initializeWindowSize = function () {
                $scope.availableHeight = $window.innerHeight;
            };
            $scope.initializeWindowSize();
            return angular.element($window).bind('resize', function () {

                $scope.initializeWindowSize();
                return $scope.$apply();
            });
        };
    }]);
