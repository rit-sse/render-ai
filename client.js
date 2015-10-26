var Client = IgeClass.extend({
	classId: 'Client',

	init: function () {
		//ige.timeScale(0.1);
		ige.showStats(1);

		// Load our textures
		var self = this;
		
		// Enable networking
		ige.addComponent(IgeNetIoComponent);
		
		// Add physics and setup physics world
		ige.addComponent(IgeBox2dComponent)
			.box2d.sleep(true)
			.box2d.createWorld()
			.box2d.start();
		
		// Implement our game methods
		this.implement(ClientNetworkEvents);

		// Create the HTML canvas
		ige.createFrontBuffer(true);

		// Load the textures we want to use
		this.textures = {
			ship: new IgeTexture('./assets/PlayerTexture.js'),
			sprite: new IgeTexture('./assets/character.png'),
			projectile: new IgeTexture('./assets/ProjectileTexture.js'),
		};

		ige.on('texturesLoaded', function () {
			// Ask the engine to start
			ige.start(function (success) {
				// Check if the engine started successfully
				if (success) {
					
					
					
					// Start the networking (you can do this elsewhere if it
					// makes sense to connect to the server later on rather
					// than before the scene etc are created... maybe you want
					// a splash screen or a menu first? Then connect after you've
					// got a username or something?
					ige.network.start('http://67.247.88.215:2000', function () {
						// Setup the network command listeners
						ige.network.define('playerEntity', self._onPlayerEntity); // Defined in ./gameClasses/ClientNetworkEvents.js

						// Setup the network stream handler
						ige.network.addComponent(IgeStreamComponent)
							.stream.renderLatency(80) // Render the simulation 160 milliseconds in the past
							// Create a listener that will fire whenever an entity
							// is created because of the incoming stream data
							.stream.on('entityCreated', function (entity) {
								self.log('Stream entity created with ID: ' + entity.id());

							});
						
						self.mainScene = new IgeScene2d()
							.id('mainScene');
							
						// Create the scene
						self.scene1 = new IgeScene2d()
							.id('scene1')
							.backgroundPattern(new IgeTexture('./assets/tile.png'), 'repeat', false, false)
							.mount(self.mainScene);

						self.uiScene = new IgeScene2d()
							.id('uiScene')
							.ignoreCamera(true)
							.mount(self.mainScene);

						// Create the main viewport and set the scene
						// it will "look" at as the new scene1 we just
						// created above
						self.vp1 = new IgeViewport()
							.id('vp1')
							.autoSize(true)
							.scene(self.mainScene)
							.drawBounds(false)
							.mount(ige);

						// Define our player controls
						ige.input.mapAction('left', ige.input.key.a);
						ige.input.mapAction('right', ige.input.key.d);
						ige.input.mapAction('up', ige.input.key.w);
						ige.input.mapAction('down', ige.input.key.space);
						ige.input.mapAction('fire', ige.input.mouse.button1)

						// Ask the server to create an entity for us
						ige.network.send('playerEntity');
						
						// We don't create any entities here because in this example the entities
						// are created server-side and then streamed to the clients. If an entity
						// is streamed to a client and the client doesn't have the entity in
						// memory, the entity is automatically created. Woohoo!

						// Enable console logging of network messages but only show 10 of them and
						// then stop logging them. This is a demo of how to help you debug network
						// data messages.
						ige.network.debugMax(10);
						ige.network.debug(true);
						
						// A User Interface!
						// Create an IgeUiTimeStream entity that will allow us to "visualise" the
						// timestream data being interpolated by the player entity
						// self.tsVis = new IgeUiTimeStream()
						// 	.height(140)
						// 	.width(400)
						// 	.top(0)
						// 	.center(0)
						// 	.mount(self.uiScene);

						// self.custom1 = {
						// 	name: 'Delta',
						// 	value: 0
						// };

						// self.custom2 = {
						// 	name: 'Data Delta',
						// 	value: 0
						// };

						// self.custom3 = {
						// 	name: 'Offset Delta',
						// 	value: 0
						// };

						// self.custom4 = {
						// 	name: 'Interpolate Time',
						// 	value: 0
						// };

						// ige.watchStart(self.custom1);
						// ige.watchStart(self.custom2);
						// ige.watchStart(self.custom3);
						// ige.watchStart(self.custom4);
					});
				}
			});
		});
	}
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = Client; }