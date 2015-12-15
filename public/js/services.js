'use strict';

/* Services */
angular.module('theLawFactory.services', ['theLawFactory.config'])
	.config(['$httpProvider', function($httpProvider) {
	        delete $httpProvider.defaults.headers.common["X-Requested-With"]
	    }])
	
	.factory('apiService', function($http, $q) {
	  
	  return {
	    
	    getDataSample : function(url){
	        var deferred = $q.defer();
	        $http.get(url).success(function(data){
	            deferred.resolve(data);
	        }).error(function(){
	            deferred.reject("An error occured while fetching data sample");
	        });
        
        	return deferred.promise;
            }
          }
        })
    .factory('api', function($http, $q, apiService, API_ROOT_URL) {
            if (API_ROOT_URL.substr(-1) != "/") API_ROOT_URL += "/";
            var api = {
                getLawlist: function() {
                    return apiService.getDataSample(API_ROOT_URL+ 'dossiers_promulgues.csv');
                },
                getProcedure: function(id) {
                    return apiService.getDataSample(API_ROOT_URL + id + '/viz/procedure.json');
                },
                getArticle: function(id) {
                    return apiService.getDataSample(API_ROOT_URL + id + '/viz/articles_etapes.json');
                },
                getAmendement: function(id, step) {
                    return apiService.getDataSample(API_ROOT_URL + id + '/viz/amendements_' + step + '.json');
                },
                getIntervention: function(id) {
                    return apiService.getDataSample(API_ROOT_URL + id + '/viz/interventions.json');
                },
                getDossiers: function() {
                    return apiService.getDataSample(API_ROOT_URL + 'dossiers_0_49.json');
                },
                getTutorials: function() {
                    return apiService.getDataSample('tutorial.json');
                }
            };
            return api;
	});

                  

