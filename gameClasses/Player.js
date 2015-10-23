var Player = IgeEntity.extend({
	classId: 'Player',
	
	init: function() {
		IgeEntity.prototype.init.call(this);
		
		var self = this;
		
		this.drawBounds(false);
		
		this.playerSpeed = 0.5;
		
		this.mousePos = ige._currentViewport.mousePosWorld();
		
		this.controls = {
			left: false,
			right: false,
			up: false,
			down: false
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

		if (ige.input.actionState('fire')) {
			var positions = [ ige._currentViewport.mousePosWorld(),
							this.worldPosition() ];
							
			ige.network.send('projectileEntity', positions);
		}
		
		// Call the IgeEntity (super-class) tick() method
		IgeEntity.prototype.tick.call(this, ctx);
	},
	
});

function move_player(self) {
	
	// Server side movement calculations
	if (ige.isServer) {
		
		// Look at mouse position
		self.rotateToPoint(self.mousePos);
		
		var x_move = 0;
		var y_move = 0;
		
		if (self.controls.left) {
			x_move += -self.playerSpeed;
		}

		if (self.controls.right) {
			x_move += self.playerSpeed;
		}
		
		if (self.controls.up) {
			y_move += -self.playerSpeed;
		}
		
		if (self.controls.down) {
			y_move += self.playerSpeed;
		}
		
		self.velocity.x(x_move);
		self.velocity.y(y_move);
	}

	// Client side information gathering
	if (ige.isClient) {
		
		// Record mouse position
		ige.network.send('playerMousePos', ige._currentViewport.mousePosWorld());
		
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

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = Player; }