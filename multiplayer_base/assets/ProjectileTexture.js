var image = {
	render: function (ctx, entity) {
		// Draw the player entity
		ctx.beginPath();
		ctx.arc(0, 0, 5, 0, 2*Math.PI);
		ctx.fillStyle="red";
		ctx.fill();
		ctx.stroke();
	}
};