var Projectile = IgeEntity.extend({
    classId: 'Projectile',

    init: function() {
        IgeEntity.prototype.init.call(this);

        var self = this;

        this.drawBounds(false);

        //base acceleration
        this.accel = -0.01;
        //base initial velocity
        this.initVel = 1 / 16; // divide by 16 to account for _tickDelta

        this.mousePos;
        this.playerPos;
        this.playerVel;

        if (ige.isServer) {
            this.addComponent(IgeVelocityComponent);
        }

        if (ige.isClient) {
            self.texture(ige.client.textures.projectile)
            .width(2)
            .height(2)
        }
    },
    
    setPositions: function (position, clientId) {
        this.mousePos = position;
        this.playerPos = ige.server.players[clientId].worldPosition();
        this.playerVel = ige.server.players[clientId].velocity
        
        this.translateToPoint(this.playerPos);
        return this;
    },

    /**
     * Called every frame by the engine when this entity is mounted to the
     * scenegraph.
     * @param ctx The canvas context to render to.
     */
    tick: function (ctx) {

        move_projectile(this);

        // Call the IgeEntity (super-class) tick() method
        IgeEntity.prototype.tick.call(this, ctx);
    },
});

function move_projectile(self) {
    if (ige.isServer){
        ige.network.log(
            self.PlayerVel
        )
        //Get velocity vectors based on mousePos and base initial velocity
        var moveX = (self.mousePos.x - self.playerPos.x);
        var moveY = (self.mousePos.y - self.playerPos.y);

        var angleRad = Math.atan2(moveY, moveX);

        self.velocity.byAngleAndPower(angleRad, self.initVel * ige._tickDelta, false);
    }
}

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = Projectile; }