angular.module('theLawFactory')
.run(function ($rootScope, $location, $http, GOOGLE_ANALYTICS_ID, HOST_FOR_GOOGLE) {
    if (GOOGLE_ANALYTICS_ID) {
        (function (i, s, o, g, r, a, m) {
            i['GoogleAnalyticsObject'] = r;
            i[r] = i[r] || function () {
                    (i[r].q = i[r].q || []).push(arguments)
                }, i[r].l = 1 * new Date();
            a = s.createElement(o),
                m = s.getElementsByTagName(o)[0];
            a.async = 1;
            a.src = g;
            m.parentNode.insertBefore(a, m)
        })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');
        ga('create', GOOGLE_ANALYTICS_ID, HOST_FOR_GOOGLE);
        $rootScope.$on('$viewContentLoaded', function () {
            ga('send', 'pageview', $location.url());
        });
    }
});
