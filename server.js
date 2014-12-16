var settings = require("./settings.json");

var io = require("socket.io").listen(settings.listen);
var ioclient = require("socket.io-client");
var guid = require("./guid.js");
var messages = require("./messages.js");

var express = require('express');
var app = express();
var path = require("path");

var datastore = require("./datastore.js");

var neighbours = [];

var serverid = guid();
console.log("Server: " + serverid);

app.get('/', function (request, response) {
	response.json(datastore.getAll());
});

var server = app.listen(settings.api.listen);

io.sockets.on('connection', function(socket){
	var address = socket.handshake.address;

	var connect = function(ip, port, guid) {
		if(guid !== serverid)
		{
			if(neighbours.length < settings.max)
			{
				addClient(ip, port);
				socket.emit('message', messages.createSuccessMessage());
			}
			else
			{
				var pool = [];

				neighbours.forEach(function(neighbour){
					pool.push({ ip: neighbour.ip, port: neighbour.port});
				});

				socket.emit('message', messages.createMoveMessage(pool));
				socket.disconnect();
			}
		}
		else
		{
			socket.emit('message', messages.createLoopbackMessage());
			socket.disconnect();
		}
		
	};

	socket.on('message', function(data){
		switch(data.type){
			case "connect": connect(address, data.listen, data.guid); break;
			default: console.log("Server received unknown message of type " + data.type);
		}
	});

	socket.on('disconnect', function(){
		console.log("disconnected " + address);
	});

	console.log("New connection from " + address);
});

var clientCreator = function(serverip, serverport){
	console.log("Connecting to: %s:%s", serverip, serverport);
	var client = ioclient.connect("http://" + serverip + ":" + serverport, {reconnect: true});

	var move = function(connections){
		removeNeighbour(findNeighbourByIp(serverip));

		client.disconnect();

		connections.forEach(function(connection){
			addClient(connection.ip, connection.port);
			console.log("Connection " + serverip + " moving to " + connection.ip);
		});
	};

	var update = function(message) {
		if(Date.now() < message.expires) {
			merge(message.id, message.data, message.modifiedby, message.modifiedat);
			io.sockets.emit('message', message);
		}
	}

	client.on('message', function(data){
		switch(data.type){
			case "success": break;
			case "move": move(data.connections); break;
			case "update": update(data); break;
			case "loopback": removeNeighbour(findNeighbourByIp(serverip)); client.disconnect(); break;
			default: console.log("Client received unknown message of type " + data.type);
		}
	});

	client.on('disconnect', function(){
		removeNeighbour(findNeighbourByIp(serverip));

		client.disconnect();
	});

	client.emit('message', messages.createConnectMessage(settings.listen, serverid));

	return {
		emit: function(data) { client.emit('message', data); },
		disconnect: function() { client.disconnect(); },
		ip: serverip,
		port: serverport
	};
};

var sendToAllNeighbours = function(data){
	neighbours.forEach(function(neighbour){
		neighbour.emit(data);
	});
};

var removeNeighbour = function(neighbour) {
	if(neighbour === null)
		return;
	console.log('Removing neighbour: %s', neighbour.ip);
	var index = neighbours.indexOf(neighbour);
	neighbours.splice(index, 1);
	neighbour.disconnect();
};

var findNeighbourByIp = function(ip) {
	var found = null;

	for (var i = 0; i < neighbours.length; i++) {
		if(neighbours[i].ip === ip)
		{
			found = neighbours[i];
			console.log("Found neighbour: "+ ip);
		}
	}

	return found;
};

var addClient = function(ip, port){
	if(!findNeighbourByIp(ip)){
		neighbours.push(clientCreator(ip, port));
	}
	else
	{
		console.log("Client already established to %s:%s", ip, port);
	}
};

settings.connections.forEach(function(connection){
	addClient(connection.ip, connection.port);
});

// TESTING METHODS

var rand = function() {
	var number = Math.floor(Math.random() * 1000);

	datastore.addOrUpdate("rand", number, serverid);
	var message = datastore.findLastUpdate("rand");

	io.sockets.emit("message", messages.createDataUpdateMessage("rand", message.data, message.modifiedby, message.modifiedat));

	setTimeout(rand, 10000);
};
rand();

var logging = function() {
	console.log("Logging data");
	console.log("------------");

	console.log("");

	console.log("Server: " + serverid);

	console.log("");

	console.log("Neighbours: %s / %s ",  neighbours.length, settings.max);
	neighbours.forEach(function(neighbour){
		console.log("Connection to %s:%s", neighbour.ip, neighbour.port);
	});
	setTimeout(logging, 30000);
};
setTimeout(logging, 30000);