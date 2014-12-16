var messageCreator = function(){
    return {
        createConnectMessage: function(port, guid){
            return {
                timestamp: Date.now(),
                type: "connect",
                listen: port,
                guid: guid
            };
        },
        createDataMessage: function(message){
            return {
                timestamp: Date.now(),
                type: "message",
                data: message
            };
        },
        createSuccessMessage: function() {
        	return {
        		timestamp: Date.now(),
        		type: "success"
        	};
        },
        createMoveMessage: function(connections) {
        	return {
        		timestamp: Date.now(),
        		connections: connections,
        		type: "move"
        	};
        },
        createLoopbackMessage: function() {
            return {
                timestamp: Date.now(),
                type: "loopback"
            };
        }
    };
};

module.exports = messageCreator();