const NodeCache = require( "node-cache" );
const myCache = new NodeCache();

var querystring = require('querystring');
var express = require('express');
var http = require('http');
var utils = require('./utils');


function Server(){
	var app = express();
	
	app.set('views', './views');
	app.set('view engine', 'hbs');
	
	app.get('/mock/:mock_id', function(request, response){
		var mockId = request.params.mock_id;
		var cached = myCache.get(mockId);
		if (cached){
			response.render('mock', { id: mockId, mock: cached, body: JSON.stringify(cached.body)});
		} else {
			response.render('mock', { id: mockId, mock: cached });
		}
	});
	
	app.use('/static', express.static('public'));
	app.use('/static/lib', express.static('bower_components'));
	
	app.use('/router-app/router/mobile', function(request, response) {
		var headers = request.headers;
		var method = request.method;
		var path = request.originalUrl;
		var body = '';
  
		request.on('error', function(err) {
			console.error(err);
		}).on('data', function(chunk) {
			body += chunk;
		}).on('end', function() {
			var keyCache = utils.makeMd5(body);
			var cached = myCache.get(keyCache);
			if ( cached == undefined ){
				
				var options = {
					hostname: "dimas.cit",
					path: path,
					port: 8085,
					method: method,
					headers: headers
				}
				
				var dimas = http.request(options, (res) => {
					var body = '';
					
					res.on('data', (chunk) => {
						body += chunk;
					}).on('end', () => {
						body = JSON.parse(body);
						body.mockID = keyCache;
						
						console.log("EITAAA: " + body.statusCode);

						cache = {body: body, headers: res.headers, statusCode: res.statusCode};
						myCache.set(keyCache, cache, function( err, success ){
							if( !err && success ){
								console.log( "SAVE CACHE -> " + success );
								console.log( "BODY -> " + body );
							}
						});

						response.set(res.headers)
						.status(res.statusCode)
						.json(body);
					});
				}).on('error', (e) => {
					response.json({error: "Não foi encontrato o Dimas"});
				});
				
				console.log("CHAMA DIMAS: " + body);
				dimas.write(body);
				
			} else {
				response
				.set(cached.headers)
				.status(cached.statusCode)
				.json(cached.body);
			}
	
		});
	});
	
	this.start = function(){
		//create node.js http server and listen on port
		http.createServer(app).listen(3000);
	};
	
};

module.exports = Server;