var Player = IgeEntityBox2d.extend({
	classId: 'Player',
	
	init: function(id) {
		IgeEntity.prototype.init.call(this);
		
		var self = this;
		
		this.clientId = id;
		
		this.drawBounds(false);

		this.playerSpeed = 3 / 16; // divide by 16 to account for _tickDelta
		this.nowSpeed = this.playerSpeed;
		this.fireCoolDown = 1 * 1000;

		this.elapsedTime = 0;

		this.mousePos = ige._currentViewport.mousePosWorld();
		
		this.controls = {
			left: false,
			right: false,
			up: false,
			down: false,
		};
		
		this.states = {
			hasFired: false,
		};
		
		if (ige.isServer) {
			this.addComponent(IgeVelocityComponent);
		}

		if (ige.isClient) {
			self.texture(ige.client.textures.ship)
			.width(20)
			.height(20)
		}
		
		// Define the data sections that will be included in the stream
		this.streamSections(['transform', 'score']);
	},
	
	/**
	 * Override the default IgeEntity class streamSectionData() method
	 * so that we can check for the custom1 section and handle how we deal
	 * with it.
	 * @param {String} sectionId A string identifying the section to
	 * handle data get / set for.
	 * @param {*=} data If present, this is the data that has been sent
	 * from the server to the client for this entity.
	 * @return {*}
	 */
	streamSectionData: function (sectionId, data) {
		// Check if the section is one that we are handling
		if (sectionId === 'score') {
			// Check if the server sent us data, if not we are supposed
			// to return the data instead of set it
			if (data) {
				// We have been given new data!
				this._score = data;
			} else {
				// Return current data
				return this._score;
			}
		} else {
			// The section was not one that we handle here, so pass this
			// to the super-class streamSectionData() method - it handles
			// the "transform" section by itself
			return IgeEntity.prototype.streamSectionData.call(this, sectionId, data);
		}
	},
	
	/**
	 * Called every frame by the engine when this entity is mounted to the
	 * scenegraph.
	 * @param ctx The canvas context to render to.
	 */
	tick: function (ctx) {
		move_player(this);
		
		
		fire_projectile(this);
		
		// Call the IgeEntity (super-class) tick() method
		IgeEntity.prototype.tick.call(this, ctx);
	},
	
});

function move_player(self) {
	
	// Server's player movement calculations
	if (ige.isServer) {
		// Look at mouse position
		self.rotateToPoint(self.mousePos);

		// Gather the velocity and make an angle
		var moveX = (self.mousePos.x - ige.server.players[self.clientId].worldPosition().x);
        var moveY = (self.mousePos.y - ige.server.players[self.clientId].worldPosition().y);
		var angleRad = Math.degrees(Math.atan2(moveY, moveX));
		
		if (self.controls.up) {
			self.velocity.linearForce(angleRad, self.playerSpeed * ige._tickDelta);
		}
		if (self.controls.left) {
			self.velocity.linearForce(angleRad - 90, self.playerSpeed * ige._tickDelta / 1.2);
		}
		if (self.controls.right) {
			self.velocity.linearForce(angleRad + 90, self.playerSpeed * ige._tickDelta / 1.2);
		}
		if (!self.controls.up && !self.controls.down && !self.controls.left && !self.controls.right) {
			self.velocity.linearForce(angleRad, 0);
		}
		
		// Always apply friction
		self.velocity.friction(0.085);
		self.velocity._applyFriction();
	}

	// Client's player information gathering
	if (ige.isClient) {
		// Record mouse position client side and server side to remain in sync
		self.mousePos = ige._currentViewport.mousePosWorld();
		ige.network.send('playerMousePos', self.mousePos);
		
		// Move Left
		if (ige.input.actionState('left')) {
			if (!self.controls.left) {
				// Record the new state
				self.controls.left = true;

				// Tell the server about our control change
				ige.network.send('playerControlLeftDown');
			}
		} else {
			if (self.controls.left) {
				// Record the new state
				self.controls.left = false;

				// Tell the server about our control change
				ige.network.send('playerControlLeftUp');
			}
		}

		// Move Right
		if (ige.input.actionState('right')) {
			if (!self.controls.right) {
				// Record the new state
				self.controls.right = true;

				// Tell the server about our control change
				ige.network.send('playerControlRightDown');
			}
		} else {
			if (self.controls.right) {
				// Record the new state
				self.controls.right = false;

				// Tell the server about our control change
				ige.network.send('playerControlRightUp');
			}
		}

		// Move Up
		if (ige.input.actionState('up')) {
			if (!self.controls.up) {
				// Record the new state
				self.controls.up = true;

				// Tell the server about our control change
				ige.network.send('playerControlUpDown');
			}
		} else {
			if (self.controls.up) {
				// Record the new state
				self.controls.up = false;

				// Tell the server about our control change
				ige.network.send('playerControlUpUp');
			}
		}
		
		// Move Down
		if (ige.input.actionState('down')) {
			if (!self.controls.down) {
				// Record the new state
				self.controls.down = true;

				// Tell the server about our control change
				ige.network.send('playerControlDownDown');
			}
		} else {
			if (self.controls.down) {
				// Record the new state
				self.controls.down = false;

				// Tell the server about our control change
				ige.network.send('playerControlDownUp');
			}
		}
	}
}
	
function fire_projectile(self) {
	if (ige.isServer) {
		if (self.states.hasFired) {
			ige.server._onProjectileEntity(self.mousePos, self.clientId);
			self.states.hasFired = false;
		}
	}
	
	if (ige.isClient) {
		if (ige.input.actionState('fire')) {
			if (!self.states.hasFired) {
				// Record the new state
				self.states.hasFired = true;
	
				// Tell the server about our state change
				ige.network.send('playerStateHasFired');
				
				// var a = new IgeTimeout(function () {
				// 	 // Record the new state
				// 	 self.states.hasFired = false;
					 
				// 	 // Tell the server about our control change
				// 	 ige.network.send('playerStateCanFire');
				// 	 }, self.fireCoolDown);
			}
		} else {
			if (self.states.hasFired ) {//&& (self.elapsedTime > self.fireCoolDown)) {
				// Record the new state
				self.states.hasFired = false;
	
				// Tell the server about our control change
				ige.network.send('playerStateCanFire');
			}
		}
	}
	
	// self.elapsedTime += 1;
}

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = Player; }