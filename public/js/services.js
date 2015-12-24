'use strict';

/* Services */
angular.module('theLawFactory.services', ['theLawFactory.config'])
    .config(['$httpProvider', function ($httpProvider) {
        delete $httpProvider.defaults.headers.common["X-Requested-With"]
    }])
    .factory('apiService', function ($http, $q) {
        return {
            getDataSample: function (url) {
                var deferred = $q.defer();
                $http.get(url).success(function (data) {
                    deferred.resolve(data);
                }).error(function () {
                    deferred.reject("An error occured while fetching data sample");
                });
                return deferred.promise;
            }
        }
    })
    .factory('api', function ($http, $q, apiService, API_ROOT_URL) {
        if (API_ROOT_URL.substr(-1) != "/") API_ROOT_URL += "/";
        var api = {
            getLawlist: function () {
                return apiService.getDataSample(API_ROOT_URL + 'dossiers_promulgues.csv');
            },
            getProcedure: function (id) {
                return apiService.getDataSample(API_ROOT_URL + id + '/viz/procedure.json');
            },
            getArticle: function (id) {
                return apiService.getDataSample(API_ROOT_URL + id + '/viz/articles_etapes.json').then(function(data) {
                    var directories = [];
                    d3.values(data.articles)
                        .forEach(function(article) {
                            article.steps.forEach(function(step) {
                                directories.push(step.directory);
                            });
                        });

                    data.directories = d3.set(directories).values();

                    var articlesList = d3.values(data.articles).sort(thelawfactory.utils.articleSort);

                    data.stages = thelawfactory.utils.computeStages(articlesList);
                    data.sectionsList = thelawfactory.utils.computeSections(articlesList);

                    articlesList.forEach(function (d, i) {
                        d.steps.forEach(function (f, j) {
                            f.loi = id;
                            f.textDiff = "";
                            f.article = d.titre;
                            f.section = d.section;
                            f.prev_step = null;
                            f.prev_dir = null;
                            f.sect_num = data.sectionsList.indexOf(f.section);
                            f.step_num = thelawfactory.utils.findStage(data.stages, f.id_step);
                            if (j != 0 && f.id_step.substr(-5) != "depot") {
                                var k = j - 1;
                                while (k > 0 && d.steps[k].status === "echec") k--;
                                f.prev_step = d.steps[k].step_num;
                                f.prev_dir = d.steps[k].directory;
                            }
                        });
                    });

                    return data;
                });
            },
            getAmendement: function (id, step) {
                return apiService.getDataSample(API_ROOT_URL + id + '/viz/amendements_' + step + '.json');
            },
            getIntervention: function (id) {
                return apiService.getDataSample(API_ROOT_URL + id + '/viz/interventions.json');
            },
            getDossiers: function () {
                return apiService.getDataSample(API_ROOT_URL + 'dossiers_0_49.json');
            },
            getTutorials: function () {
                return apiService.getDataSample('tutorial.json');
            },
            getTexte: function (loi, directory) {
                return $http.get(encodeURI(API_ROOT_URL + loi + "/procedure/" + directory + "/texte/texte.json"))
                    .then(function(response) {
                        response.data.directory = directory;
                        return response.data;
                    });
            }
        };

        api.getTextArticles = function(loi, directories) {
            var promises = directories
                .sort()
                .map(function(directory) {
                    return api.getTexte(loi, directory)
                });

            return $q.all(promises).then(function(results) {
                var textArticles = {};

                results.forEach(function (texte) {
                    texte.articles.forEach(function(article) {
                        if (!textArticles[article.titre]) textArticles[article.titre] = {};
                        textArticles[article.titre][texte.directory] = [];
                        Object.keys(article.alineas)
                            .sort()
                            .forEach(function (k) {
                                textArticles[article.titre][texte.directory].push(article.alineas[k]);
                            });
                    });
                });

                return textArticles;
            });
        };

        return api;
    });

                  

