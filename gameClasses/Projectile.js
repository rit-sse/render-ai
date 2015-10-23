var Projectile IgeEntity.extend({
    classId: 'Projectile',

    init: function() {
        IgeEntity.prototype.init.call(this);

        var self = this;

        this.drawBounds(false);

        //base acceleration
        this.accel = -0.01;
        //base initial velocity
        this.initVel = 0.3;

        this.mousePos;

        if (ige.isServer) {
            this.addComponent(IgeVelocityComponent);
        }

        if (ige.isClient) {
            self.texture(ige.client.textures.projectile)
            .width(5)
            .height(5)
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

        move_projectile(this);

        // Call the IgeEntity (super-class) tick() method
        IgeEntity.prototype.tick.call(this, ctx);
    },
});

function move_projectile(self) {
    if (ige.isServer){

        //Get velocity vectors based on mousePos and base initial velocity
        var mouse_x = self.mousePos.to2d().x;
        var mouse_y = self.mousePos.to2d().y;

        var angleRad = Math.atan(mouse_y/mouse_x) * Math.PI / 180;

        self.byAngleAndPower(angleRad, self.initVel, false);
    }

    if (ige.isClient){
        // Record mouse position
        ige.network.send('playerMousePos', ige._currentViewport.mousePos());
    }
}