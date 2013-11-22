/*
 * Serve JSON to our AngularJS client
 */

var request = require('request'),
	baseUrl = 'http://www.regardscitoyens.org/api',
	headers = { 'Content-type': 'application/json' };

exports.law = function (req, res) {
  request(
    {
      method : 'GET',
      url : baseUrl + req,
      headers : headers
    },

    function (error, response, body) {
      if (response.statusCode == 201) {
        res.json(JSON.parse(body));
      } else res.json({'error':JSON.parse(body)});
    }
  )
};