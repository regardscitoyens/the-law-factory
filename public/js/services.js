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