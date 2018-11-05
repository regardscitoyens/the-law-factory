'use strict';

angular.module('theLawFactory')
.directive('metrics', ['$rootScope', 'api',
function ($rootScope, api) {
    return {
        restrict: 'A',
        replace: false,
        templateUrl: 'modules/metrics/metrics.html',
        controller: function ($scope) {
            $rootScope.pageTitle = "Statistiques | ";
            $scope.mod = "metrics";
            api.getMetrics().then(function (results) {
                $('#stats-table').dataTable({
                    fixedHeader: {
                        header: false,
                        footer: false
                    },
                    lengthChange: false,
                    pageLength: 20,
                    "columns": results.meta.fields.map(c => ({
                        "title": c,
                        "data": c,
                        render: function(data, type, full, meta ) {
                            if (!data) {
                                return '';
                            }
                            if (data.indexOf && data.indexOf('http') == 0) {
                                return '<a href="' + data + '">' + data + '</a>';
                            }
                            return data || '';
                        },
                        "default": "",
                    })),
                    scrollY: '30vh',
                    data: results.data
                });
             });
        }
    }
}]);
