/*
 * Serve JSON to our AngularJS client
 */

var request = require('request'), csv = require('csv'), baseUrl = 'http://www.lafabriquedelaloi.fr/api', headers = {
	'Content-type' : 'application/json'
};

//Laws list sevice
exports.lawlist = function(req, res) {
	request({
		method : 'GET',
		url : baseUrl + "/dossiers_promulgues.csv",
		headers : {
			'Content-type' : 'Content-type: text/csv'
		}
	}, function(error, response, body) {
		if (response.statusCode == 200) {

			parsedLaw = null;

			csv().from.string(body, {
				delimiter : ';',
				rowDelimiter : "\n",
				columns : ["id", "title", "type", "startDate", "url", "status", "decCC", "decDate", "pubDate", "num", "themes"]
			}).to.array(function(data) {
				parsedLaw = data;
				parsedLaw.splice(0, 1);
				res.send(parsedLaw)
			});

		} else
			res.send("ciao");
	})
};

//Articles service (mod1)
exports.articles = function(req, res) {
	request({
		method : 'GET',
		url : baseUrl + '/' + req.params.id + '/viz/articles_etapes.json',
		headers : {
			'Content-type' : 'Content-type: application/json'
		}
	}, function(error, response, body) {

		if (response.statusCode == 200) {
			res.send(JSON.parse(body))
		} else
			res.send("ciao");
	})
};

exports.interventions = function(req, res) {
	request({
		method : 'GET',
		url : baseUrl + '/' + req.params.id + '/viz/interventions.json',
		headers : {
			'Content-type' : 'Content-type: application/json'
		}
	}, function(error, response, body) {

		if (response.statusCode == 200) {
			console.log(body)
			res.send(JSON.parse(body))
		} else
			res.send("ciao");
	})
};

//Amendements service (mod2)
exports.amendments = function(req, res) {

	request({
		method : 'GET',
		url : baseUrl + '/' + req.params.id + '/viz/amendements_'+req.params.step+'.json',
		headers : {
			'Content-type' : 'Content-type: application/json'
		}
	}, function(error, response, body) {

		if (response.statusCode == 200) {
			res.json(JSON.parse(body))
		} else
			res.send("no amendements");
	})
};


exports.amd = function(req, res) {
	console.log("url",req.params.url)
	request({
		method : 'GET',
		url : decodeURI(req.params.url),
		/*headers : {
			'Content-type' : 'text/plain'
		}*/
	}, function(error, response, body) {
		console.log(response)
		if (response.statusCode == 200) {
			
			res.send(JSON.parse(body))
		} else
			res.send("no amendements");
	})
};

//Procedure service (mod2)
exports.procedure = function(req, res) {

	request({
		method : 'GET',
		url : baseUrl + '/' + req.params.id + '/viz/procedure.json',
		headers : {
			'Content-type' : 'Content-type: application/json'
		}
	}, function(error, response, body) {
		if (response.statusCode == 200) {
			if (req.query.sect) {

				var info;

				if (req.query.sect == "amd")
					info = getAmdInfo(body);
				else if (req.query.sect == "int")
					info = getIntInfo(body);
				
				res.json(info)

			} else
				res.json(JSON.parse(body))

		} else
			res.send("no procedure");
	})
};



/*************
Helper functions
**************/

function getAmdInfo(js) {
	
	var res=[]
	file=JSON.parse(js)
	for(a in file.steps) {
		if(file.steps[a].directory) {
		o={
			"step_name" : file.steps[a].directory,
			"amds" : file.steps[a].nb_amendements !== 0
		}
		res.push(o);
	}
	}
	return res
}

function getIntInfo(js) {
	
	var res=[]
	file=JSON.parse(js)
	for(a in file.steps) {
		if(file.steps[a].directory) {
		o={
			"step_name" : file.steps[a].directory,
			"ints" : file.steps[a].has_interventions
		}
		res.push(o);
		}
	}
	return res
}
