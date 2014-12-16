var io = require("socket.io-client");

var client = io.connect("http://localhost:3000");

var message = "Random number: " + Math.random();

console.log(message);

client.emit("request", message);

client.on('response', function(data){
	console.log(data.message);
});