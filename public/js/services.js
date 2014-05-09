'use strict';

/* Services */


angular.module('theLawFactory.services', [])
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
        .factory('api', function($http, $q, apiService) {
            var APIRootUrl = 'http://www.lafabriquedelaloi.fr/api';
            var api = {
                getLawlist: function() {
                    return apiService.getDataSample('laws/list/');
                },
                getProcedure: function(id) {
                    return apiService.getDataSample('law-procedure/' + id);
                },
                getArticle: function(id) {
                    return apiService.getDataSample(APIRootUrl + '/' + id + '/viz/articles_etapes.json');
                },
                getAmendement: function(id, step) {
                    return apiService.getDataSample('law-amendments/' + id + '/' + step);
                },
                getIntervention: function(id) {
                    return apiService.getDataSample('law-interventions/' + id);
                },
                getDossiers: function() {
                    return apiService.getDataSample(APIRootUrl + '/dossiers_0_49.json');
                },
                getStats: function() {
                    return apiService.getDataSample(APIRootUrl + '/stats_dossiers.json');
                }
            };
            return api;
	})
