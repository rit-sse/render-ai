var Player = IgeEntityBox2d.extend({
	classId: 'Player',
	
	init: function(id) {
		IgeEntityBox2d.prototype.init.call(this);
		
		var self = this;
		
		self.clientId = id;
		
		self.drawBounds(false);

		self.elapsedTime = 0;
		
		self.health = 100;

		self.mousePos = ige._currentViewport.mousePosWorld();
		
		self.controls = {
			left: false,
			right: false,
			up: false,
			down: false,
		};
		
		self.states = {
			hasFired: false,
		};
		

		
		if (ige.isServer) {
			self.playerSpeed = 3 / 16; // divide by 16 to account for _tickDelta
			self.nowSpeed = self.playerSpeed;
			self.fireCoolDown = 1 * 1000;
			
			self.addComponent(IgeVelocityComponent);
			
			if(ige.box2d){
				
				// Define the polygon for collision
				var triangles,
					fixDefs,
					collisionPoly = new IgePoly2d()
					.addPoint(0, -this._bounds2d.y2)
					.addPoint(this._bounds2d.x2, this._bounds2d.y2)
					.addPoint(0, this._bounds2d.y2 - 5)
					.addPoint(-this._bounds2d.x2, this._bounds2d.y2);
				// Scale the polygon by the box2d scale ratio
				collisionPoly.divide(ige.box2d._scaleRatio);
				// Now convert this polygon into an array of triangles
				triangles = collisionPoly.triangulate();
				this.triangles = triangles;

				var fixDefs = [];
				
				for (var i = 0; i < this.triangles.length; i++) {
					fixDefs.push({
						density: 1.0,
						friction: 1.0,
						restitution: 0.2,
						filter: {
							categoryBits: 0x0004,
							maskBits: 0xffff & ~0x0008
						},
						shape: {
							type: 'polygon',
							data: this.triangles[i]
						}
					});
				}
		
				fixDefs.push({
					density: 0.0,
					friction: 0.5,
					restitution: 0.2,
					filter: {
						categoryBits: 0x0008,
						maskBits: 0x0100
					},
					shape: {
						type: 'circle',
						data: {
							radius: 10
						}
					}
				})
				
				// Create the box2dBody
				self.box2dBody({
						type: 'dynamic',
							linearDamping: 0.0,
							angularDamping: 0.1,
							allowSleep: true,
							bullet: true,
							gravitic: false,
							fixedRotation: false,
							fixtures: fixDefs
					});
			}
		}

		if (ige.isClient) {
			self.texture(ige.client.textures.ship)
			.width(20)
			.height(20)
		}
		
		// Define the data sections that will be included in the stream
		self.streamSections(['transform', 'custom1']);
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
		if (sectionId === 'custom1') {
			// Check if the server sent us data, if not we are supposed
			// to return the data instead of set it
			if (data) {
				// We have been given new data!
				this._customProperty = data;
			} else {
				// Return current data
				return this._customProperty;
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
		
		if (ige.isClient) {
			get_controls(this);
		}
		
		if (ige.isServer) {
			move_player(this);
			
			fire_projectile(this);
			
			if (this.health <= 0) {
				this.destroy();
			}
		}
		
		// Call the IgeEntity (super-class) tick() method
		IgeEntityBox2d.prototype.tick.call(this, ctx);
	},
	
});

function move_player(self) {
	// Server's player movement calculations
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

function get_controls(self) {
	
	// Handle movement
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
	
	
	// Handle shooting
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
	
function fire_projectile(self) {
	if (self.states.hasFired) {
		ige.server._onProjectileEntity(self.mousePos, self.clientId);
		self.states.hasFired = false;
	}
	// self.elapsedTime += 1;
}

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = Player; }