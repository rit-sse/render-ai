var image = {
	render: function (ctx, entity) {
		// Draw the player entity
		ctx.beginPath();
		ctx.arc(0, 0, 3, 0, 2*Math.PI);
		ctx.fillStyle="magenta";
		ctx.fill();
		ctx.stroke();
	}
};