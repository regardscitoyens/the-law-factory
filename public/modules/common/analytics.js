angular.module('theLawFactory')
.run(function ($log, $rootScope, $location, GOOGLE_ANALYTICS_ID, HOST_FOR_GOOGLE, PIWIK_HOST, PIWIK_SITE_ID) {
    $log.debug('GOOGLE_ANALYTICS_ID:', GOOGLE_ANALYTICS_ID);
    $log.debug('HOST_FOR_GOOGLE:', HOST_FOR_GOOGLE);

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

    $log.debug('PIWIK_HOST:', PIWIK_HOST);
    $log.debug('PIWIK_SITE_ID:', PIWIK_SITE_ID);

    if (PIWIK_HOST && PIWIK_SITE_ID) {
        var paq = window._paq = [];
        var url = '//' + PIWIK_HOST + '/';

        paq.push(['setDomains', ['*.www.lafabriquedelaloi.fr']]);
        paq.push(['trackPageView']);
        paq.push(['enableLinkTracking']);
        paq.push(['setTrackerUrl', url + 'piwik.php']);
        paq.push(['setSiteId', PIWIK_SITE_ID]);

        var firstScript = document.getElementsByTagName('script')[0];
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.defer = true;
        script.src = url + 'piwik.js'

        firstScript.parentNode.insertBefore(script, firstScript);
    }
});
