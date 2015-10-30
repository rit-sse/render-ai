var Projectile = IgeEntityBox2d.extend({
    classId: 'Projectile',

    init: function(id) {
        IgeEntityBox2d.prototype.init.call(this);

        var self = this;
        this.drawBounds(false);
        
        if (ige.isServer) {
            //base acceleration
            this.accel = -0.01;
            
            //base initial velocity
            this.initVel = 1 / 16; // divide by 16 to account for _tickDelta
            
            this.playerVel;
            
            this.addComponent(IgeVelocityComponent);
            
            this.playerPos = ige.server.players[id].worldPosition();
            this.mousePos = ige.server.players[id].mousePos;
            
            // Hacky implementation of spawning entity "far" away from player
            var location = {
                x: 0,
                y: 0,
                z: 0,
            };
            
            if (this.mousePos.x - this.playerPos.x > 0) {
                location.x = this.playerPos.x + 20;
            } else {
                location.x = this.playerPos.x - 20;
            }
            if (this.mousePos.y - this.playerPos.y > 0) {
                location.y = this.playerPos.y + 20;
            } else {
                location.y = this.playerPos.y - 20;
            }
            
            this.translateToPoint(location);    // End hack
            
            if(ige.box2d){
            // Setup the box2d physics properties
                self.box2dBody({
                    type: 'dynamic',
                    linearDamping: 0.0,
                    angularDamping: 0.5,
                    allowSleep: false,
                    bullet: true,
                    gravitic: false,
                    fixedRotation: false,
                    fixtures: [{
                        density: 0.0,
                        friction: 0.0,
                        restitution: 0.0,
                        // isSensor: true,
                        filter: {
                            categoryBits: 0x0100,
                            maskBits: 0x0008
                        },
                        shape: {
                            type: 'circle',
                            data: {
                                radius: 5
                            }
                        }
                    }]
                });
            }
        }

        if (ige.isClient) {
            self.texture(ige.client.textures.projectile)
            .width(2)
            .height(2)
        }
    },
    
    // setPositions: function (position, clientId) {
    //     this.mousePos = position;
    //     return this;
    // },

    /**
     * Called every frame by the engine when this entity is mounted to the
     * scenegraph.
     * @param ctx The canvas context to render to.
     */
    tick: function (ctx) {

        if (ige.isServer){
            move_projectile(this);
        }

        // Call the IgeEntity (super-class) tick() method
        IgeEntityBox2d.prototype.tick.call(this, ctx);
    },
});

function move_projectile(self) {
        //Get velocity vectors based on mousePos and base initial velocity
        var moveX = (self.mousePos.x - self.playerPos.x);
        var moveY = (self.mousePos.y - self.playerPos.y);

        var angleRad = Math.atan2(moveY, moveX);

        self.velocity.byAngleAndPower(angleRad, self.initVel * ige._tickDelta, false);
}

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = Projectile; }