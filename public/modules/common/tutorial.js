'use strict';

angular.module('theLawFactory')
.directive('tutorial', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            mod: '@'
        },
        template: '<a href="#" class="button nav-item" ng-click="toggleTutorial($event)"><span title="Voir le tutoriel" data-toggle="tooltip" data-placement="left">?</span></a>',
        controller: function ($timeout, $rootScope, $scope, api) {
            $scope.toggleTutorial = function (ev) {
                ev.preventDefault();

                if (!$rootScope.tutorial) {
                    $rootScope.tutorial = true;
                    api.getTutorials().then(function (data) {
                        var tuto = data[$scope.mod];
                        var step = 1;
                        var actions = [];
                        var tutoKeys = d3.keys(tuto);
                        var i, tutoLen = tutoKeys.length;
                        for (i = 0 ; i < tutoLen ; ++i) {
                            var id = tutoKeys[i];
                            if (tuto[id].indexOf('@') != -1) {
                                var message = tuto[id].split(' @ ');
                                tuto[id] = message[0];
                                actions[step] = message[1];
                            } else {
                                actions[step] = '';
                            }
                            var infos = tuto[id].split(" = ");
                            if (id.substring(0, 4) == '.svg') {
                                id = id.substring(4);
                                id = drawDivOverElement($(id), id);
                            }
                            $(id).attr('data-position', infos[0]);
                            $(id).attr('data-tooltipClass', 'tooltip-' + id.replace(/^[#\.]/, "")); // remove selector (first # or .)
                            $(id).attr('data-intro', infos[1]);
                            $(id).attr('data-step', step++);
                        }
                        var introjs = introJs().setOptions({
                            showBullets: false,
                            showStepNumbers: false,
                            nextLabel: "suite...",
                            prevLabel: "...retour",
                            skipLabel: "quitter ce tutoriel",
                            doneLabel: "quitter ce tutoriel"
                        });
                        introjs.onbeforechange(function (e) {
                            if ($(e).hasClass('div-over-svg'))
                                $('.div-over-svg').show();
                            else $('.div-over-svg').hide();
                            var data_step = $(e).attr('data-step');
                            var acts = actions[data_step].split(' , ');
                            $.each(acts, function (index, value) {
                                var action = value.split(' = ');
                                switch (action[0]) {
                                    case 'scrolltop' :
                                        $(action[1]).scrollTop(0);
                                        break;
                                    case 'click' :
                                        $(action[1]).css('opacity', 1);
                                        try {
                                            $(action[1]).d3Click();
                                            $(action[1]).click();
                                            $(action[1])[0].click();
                                        } catch (e) {
                                        }
                                        break;
                                    case 'zoom' :
                                        thelawfactory.navettes.zooming(parseInt(action[1]));
                                        break;
                                }
                            });
                        });
                        var exit_introjs = function () {
                            $('.div-over-svg').remove();
                            $(window).scrollTop(0);
                            $rootScope.tutorial = false;
                            localStorage.setItem("tuto-" + $scope.mod, "done");
                        };
                        introjs.onexit(exit_introjs);
                        introjs.oncomplete(exit_introjs);
                        $timeout(function() {
                            introjs.start();
                        }, 0);
                    },
                    function () {
                        console.log("couldn't retrieve json tutorial");
                    });
                }
            };

            // To be used potentially when wanting to autoactivate the tutorial on first visit by user
            $scope.showFirstTimeTutorial = function () {
                $('#menu-tutorial span').tooltip({container:'body'});
                if (!localStorage.getItem("tuto-" + $scope.mod) || localStorage.getItem("tuto-" + $scope.mod) != "done")
                    $scope.toggleTutorial();
            };

            function getSVGScale (t) {
                t = t[0];
                var xforms = t.transform.animVal,
                    firstXForm, i = 0;
                while (i < xforms.numberOfItems) {
                    firstXForm = xforms.getItem(i);
                    i++;
                    if (firstXForm.type == SVGTransform.SVG_TRANSFORM_SCALE)
                        return [firstXForm.matrix.a,
                            firstXForm.matrix.d];
                }
                return [1, 1];
            }

            function getSVGTranslate (t) {
                t = t[0];
                var xforms = t.transform.baseVal,
                    firstXForm, i = 0;
                while (i < xforms.numberOfItems) {
                    firstXForm = xforms.getItem(i);
                    i++;
                    if (firstXForm.type == SVGTransform.SVG_TRANSFORM_TRANSLATE)
                        return [firstXForm.matrix.e,
                            firstXForm.matrix.f];
                }
                return [0, 0];
            }

            /**
             * Draw a div over the jQuery node passed as argument
             */
            function drawDivOverElement (oElement, sElementClass) {
                var selk = $scope.mod == "navettes" ? '#gantt' : '#viz';
                if (oElement.prop('tagName') == 'rect') {
                    var oNewElement = oElement.clone(true);
                    oNewElement.attr('x', 0).attr('y', 0).attr('style', oElement.parent().attr('style'));
                    var scale0 = getSVGScale(oElement.parent());
                    var scale1 = getSVGScale(oElement.parent().parent());
                    var trans0 = getSVGTranslate(oElement.parent());
                    var trans1 = getSVGTranslate(oElement.parent().parent());
                    var width = oElement.attr('width') * scale0[0] * scale1[0];
                    var height = oElement.attr('height') * scale0[1] * scale1[1];
                    var left = $(selk).offset().left +
                        parseInt(oElement.attr('x')) * scale0[0] * scale1[0] +
                        trans0[0] + trans1[0];
                    var top = $(selk).offset().top +
                        parseInt(oElement.attr('y')) * scale0[1] * scale1[1] +
                        trans0[1] + trans1[1];
                } else if (oElement.prop('tagName') == 'g') {
                    var oNewElement = oElement.clone(true);
                    var bbox = d3.select(sElementClass)[0][0].getBBox();
                    var width = bbox.width;
                    var height = bbox.height;
                    if ($scope.mod == "amendements")
                        height += 20;
                    var top = $(selk).offset().top + d3.select(sElementClass)[0][0].getBBox().y + parseInt(oElement.attr('data-offset'));
                    var left = $(selk).offset().left + bbox.x;
                    oNewElement.find('*').each(function () {
                        var x = $(this).attr('x');
                        $(this).attr('x', x - bbox.x);
                        var y = $(this).attr('y');
                        $(this).attr('y', y - bbox.y);
                    });
                } else {
                    console.log("Weird tag given on element: ", oElement, oElement.prop('tagName'));
                }
                var sElementClass = sElementClass.replace('.', '') + '-div';
                var node = '<div class="' + sElementClass + ' div-over-svg" style="position: absolute; top: ' + top + 'px; left : ' + left + 'px; width: ' + width + 'px; height: ' + height + 'px;"><svg id="introsvg"></svg></div>';
                $('body').append(node);
                $("#introsvg").append(oNewElement);
                return '.' + sElementClass;
            }
        }
    }
});