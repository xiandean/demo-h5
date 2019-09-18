/**
 * @param {Object} options
 * 例：
 * {
 * 		{Number} x 圆点x坐标 
 * 		{Number} y 圆点y坐标 
 * 		{Number} radius 半径
 * 		{Number} startAngle 弧起始角度(默认从左中逆时针画起)
 * }
 *
 * @method
 * 例：
 * {
 * 		draw(context, percent)
 * }
 */
export default class Circle {
	constructor(options = {}) {
		this.x = options.x;
		this.y = options.y;

		this.radius = options.radius;    // 圆环半径
	    this.lineWidth = options.lineWidth || 2;  // 圆环边的宽度
	    this.strokeStyle = options.strokeStyle || '#000000'; //边的颜色

	    this.lineCap = options.lineCap || 'round';

	    this.startAngle = options.startAngle * Math.PI / 180 + Math.PI || Math.PI; //弧起始角度
	}

	draw(ctx, percent = 100) {
	    ctx.beginPath();
	    ctx.arc(this.x, this.y, this.radius, this.startAngle, this.startAngle - percent / 100 * Math.PI * 2, true);
	    ctx.lineWidth = this.lineWidth;
	    ctx.strokeStyle = this.strokeStyle;
	    ctx.lineCap = this.lineCap;

	    ctx.stroke();
	    ctx.closePath();
	}
}
