var ServerNetworkEvents = {
	/**
	 * Is called when the network tells us a new client has connected
	 * to the server. This is the point we can return true to reject
	 * the client connection if we wanted to.
	 * @param data The data object that contains any data sent from the client.
	 * @param clientId The client id of the client that sent the message.
	 * @private
	 */
	_onPlayerConnect: function (socket) {
		// Don't reject the client connection
		return false;
	},

	_onPlayerDisconnect: function (clientId) {
		if (ige.server.players[clientId]) {
			// Remove the player from the game
			ige.server.players[clientId].destroy();

			// Remove the reference to the player entity
			// so that we don't leak memory
			delete ige.server.players[clientId];
			
			// Print the number of online players
			var playercount= 0;
			
			for (var player in ige.server.players) {
				playercount++;
			}
			
			ige.server.log(playercount + " players online");
		}
	},

	_onPlayerEntity: function (data, clientId) {
		if (!ige.server.players[clientId]) {
			ige.server.players[clientId] = new Player(clientId)
				.streamMode(1)
				.mount(ige.server.scene1);
				
			// Tell the client to track their player entity
			ige.network.send('playerEntity', ige.server.players[clientId].id(), clientId);
			
			// Print the number of online players
			var playercount= 0;
			
			for (var player in ige.server.players) {
				playercount++;
			}
			
			ige.server.log(playercount + " players online");
		}
	},

	_onPlayerLeftDown: function (data, clientId) {
		ige.server.players[clientId].controls.left = true;
	},

	_onPlayerLeftUp: function (data, clientId) {
		ige.server.players[clientId].controls.left = false;
	},

	_onPlayerRightDown: function (data, clientId) {
		ige.server.players[clientId].controls.right = true;
	},

	_onPlayerRightUp: function (data, clientId) {
		ige.server.players[clientId].controls.right = false;
	},

	_onPlayerUpDown: function (data, clientId) {
		ige.server.players[clientId].controls.up = true;
	},

	_onPlayerUpUp: function (data, clientId) {
		ige.server.players[clientId].controls.up = false;
	},
	
	_onPlayerDownDown: function (data, clientId) {
		ige.server.players[clientId].controls.down = true;
	},

	_onPlayerDownUp: function (data, clientId) {
		ige.server.players[clientId].controls.down = false;
	},
	
	_setMousePos: function (data, clientId) {
		ige.server.players[clientId].mousePos = data;
	},

	_onProjectileEntity: function (data, clientId) {
		var projectile = new Projectile(clientId)
			.streamMode(1)
			.setPositions(data, clientId)
			.lifeSpan(1000) // TODO: Remove when velocity = 0
			.mount(ige.server.scene1);
	},
};

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = ServerNetworkEvents; }