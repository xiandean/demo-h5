import { getRandomInt } from '../utils';
/**
 * @param {Object}
 * 例：
 * {
 *     {String} canvas 画布#id或.class
 *     {Number} width 画布宽度
 *     {Number} height 画布高度
 *     {Array [String]} colors 文字颜色，dark：随机深色、light：随机浅色
 *     {Number} avatarSize 头像大小
 *     {Number} bgPadding 带背景是背景padding值
 *     {Number} fontSize 文字大小
 *     {String} fontWeight 文字粗细
 *     {String} fontFamily 字体
 *     {Number} rows 行数
 *     {Number} speed 文字移动速度
 *     {Number} minSpace 两个弹幕之间的最小间距
 *     {Number} maxSpace 两个弹幕之间的最大间距
 *     {Boolean} loop 是否循环播放弹幕
 *     {Array [{avatar: 头像, name: 昵称, text: 内容}]} list 弹幕列表
 *     {Boolean} hasBg 弹幕是否带背景
 * }
 *
 * @method
 * 例：
 * {
 *     play() 播放弹幕
 *     pause() 暂停播放
 *     stop() 暂停播放
 *     resume() 继续播放
 *     setList(list) (重新)设置弹幕列表
 *     clean() 清屏
 *     add({avatar: 头像, name: 昵称, text: 内容}) 添加即将播放单条弹幕
 *     isEmpty() 是否没弹幕
 * }
 *
 * @example
 * 例：
 * this.barrage = new Barrage({
 *     canvas: '#barrage',
 *     loop: true,
 *     rows: 6,
 *     fontSize: 20,
 *     hasBg: true,
 *     colors: ['light'],
 *     list: [{avatar: 头像, name: 昵称, text: 内容}, {avatar: 头像, name: 昵称, text: 内容}]
 * });
 * this.barrage.play();
 *
 * this.barrage.pause()
 * this.barrage.resume()
 * this.barrage.stop()
 *
 * this.barrage.setList(list2)
 * this.barrage.play()
 */

class Barrage {
    constructor({canvas, width, height, colors = ['dark'], avatarSize = 40, bgPadding = 12, fontSize = 24, fontWeight = 'normal', fontFamily = 'Arial', rows = 4, speed = 2, minSpace = 20, maxSpace = 60, loop = false, list = [], hasBg = false}) {
        this.canvas = document.querySelector(canvas);
        this.ctx = this.canvas.getContext('2d');
        this.tempCanvas = document.createElement('canvas');
        this.tempCtx = this.tempCanvas.getContext('2d');
        this.width = width || this.canvas.width;
        this.height = height || this.canvas.height;
        this.canvas.width = this.tempCanvas.width = this.width;
        this.canvas.height = this.tempCanvas.height = this.height;
        this.tempCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        this.tempCtx.textBaseline = 'middle';
        this.fontSize = fontSize;
        this.loop = loop;
        this.space = {min: minSpace, max: maxSpace};
        this.colors = colors;
        this.avatarSize = avatarSize;
        this.bgPadding = bgPadding;
        this.hasBg = hasBg;
        this.lineHeight = this.height / rows;
        this.rowsData = [];
        for (let i = 0; i < rows; i++) {
            this.rowsData.push({
                y: this.lineHeight / 2 + i * this.lineHeight,
                speed: speed + i * 0.2,
                list: []
            });
        }
        this.barrageList = list;
        this.tempBarrageList = [];
        this.paused = false;
    }

    // 播放下个弹幕
    _shoot(row) {
    	if (this.barrageList.length) {
    		let options = this.barrageList.shift();
            let text = options.text;
            if (options.name) {
                text = `${options.name}：${text}`;
            }
            let color = options.color || this._getColor();
            let width = options.width;
            let head = options.head;
            if (!width) {
                width = Math.ceil(this.tempCtx.measureText(text).width);
                if (!head && options.avatar) {
                    head = new Image();
                    head.src = options.avatar;
                    width += this.avatarSize + 5;
                }
                if (this.hasBg) {
                    width += this.bgPadding * 2;
                }
            }
    		let data = this.rowsData[row];
            let y = data.y;
            let speed = data.speed;

	        let barrage = {
                head: head,
	            text: text,
	            y: y,
	            x: this.width + getRandomInt(this.space.min, this.space.max),
	            color: color,
	            speed: speed,
	            width: width
	        }
	        data.list.push(barrage);
    	}
    }

    //开始绘制
    _draw() {
    	if (this.paused) {
    		return;
    	}
    	this.tempCtx.clearRect(0, 0, this.width, this.height);
    	let count = 0;
    	for (let i = 0; i < this.rowsData.length; i++) {
    		let barrageList = this.rowsData[i].list;
    		if (barrageList.length) {
	            for (let j = 0; j < barrageList.length; j++) {
	                let b = barrageList[j];
	                if (b.x + b.width <= 0) {
	                	let item = barrageList.splice(j, 1);
                        if (this.loop) {
                            this.barrageList.push(item[0]);
                            j--;
                        } else {
                            this.tempBarrageList.push(item[0].text);
                        }
	                    continue;
	                }
	                b.x -= b.speed;
	                this._drawText(b);
	                if (j === barrageList.length - 1 && b.x + b.width < this.width) { // 当前行最后一个出完了，就在当前行加下一个
	                	this._shoot(i);
	                }
	            }
	        } else {
	        	if (!this.barrageList.length) {
	        		count++;
	        		if (count === this.rowsData.length) {
	        			this._over();
                        return;
	        		}
	        	}
	        	this._shoot(i);
	        }
    	}

    	this.ctx.clearRect(0, 0, this.width, this.height);
    	this.ctx.drawImage(this.tempCanvas, 0, 0);
        requestAnimationFrame(this._draw.bind(this));
    }

    //绘制文字
    _drawText(barrage) {
        let x = barrage.x;
        if (this.hasBg) {
            this._drawBg(barrage);
            x += this.bgPadding;
        }
        this.tempCtx.fillStyle = barrage.color;
        if (barrage.head) {
            this.tempCtx.drawImage(barrage.head, x, barrage.y - this.avatarSize / 2, this.avatarSize, this.avatarSize);
            this.tempCtx.fillText(barrage.text, x + this.avatarSize + 5, barrage.y);
        } else {
            this.tempCtx.fillText(barrage.text, x, barrage.y);
        }
    }

    _drawBg(barrage) {
        if (!this.tempCtx.roundRect) {
            CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
                if (w < 2 * r) r = w / 2;
                if (h < 2 * r) r = h / 2;
                this.beginPath();
                this.moveTo(x + r, y);
                this.arcTo(x + w, y, x + w, y + h, r);
                this.arcTo(x + w, y + h, x, y + h, r);
                this.arcTo(x, y + h, x, y, r);
                this.arcTo(x, y, x + w, y, r);
                // this.arcTo(x+r, y);
                this.closePath();
                return this;
            }
        }
        this.tempCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        let bgHeight = this.fontSize + this.bgPadding * 2;
        this.tempCtx.roundRect(barrage.x, barrage.y - bgHeight / 2, barrage.width, bgHeight, bgHeight).fill();
    }

    //获取随机颜色
    _getColor() {
        let color = this.colors[getRandomInt(0, this.colors.length - 1)];
        if (color === 'dark') {
            let r = getRandomInt(0, 127);
            let g = getRandomInt(0, 127);
            let b = getRandomInt(0, 127);
            return 'rgb('+ r +','+ g +','+ b +')';
        } else if (color === 'light') {
            let r = getRandomInt(127, 255);
            let g = getRandomInt(127, 255);
            let b = getRandomInt(127, 255);
            return 'rgb('+ r +','+ g +','+ b +')';
        } else {
            return color;
        }
    }

    // 重置
    _reset () {
    	this.tempBarrageList = [];
    	for (let i = 0; i < this.rowsData.length; i++) {
    		this.rowsData[i].list = [];
    	}
        this.clean();
    }

    // 弹幕播放结束回调
    _over () {
        this.pause();
        this.barrageList = this.tempBarrageList;
        this.tempBarrageList = [];
    }

    // 设置弹幕列表
    setList (list) {
        this.barrageList = list;
        this._reset();
    }

    // 清屏
    clean () {
        this.tempCtx.clearRect(0, 0, this.width, this.height);
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    // 添加即将播放单条弹幕
    add (barrage) {
        this.barrageList.unshift(barrage);
    }

    // 是否没弹幕
    isEmpty () {
        if (this.barrageList.length || this.tempBarrageList.length) {
            return false;
        } else {
            for (let i = 0; i < this.rowsData.length; i++) {
                let barrageList = this.rowsData[i].list;
                if (barrageList.length) {
                    return false;
                }
            }
            return true;
        }
    }

    // 开始播放
    play () {
    	this.paused = false;
    	this._draw();
    }

    // 暂停播放
    pause () {
    	this.paused = true;
    }

    // 暂停播放
    stop () {
        this.paused = true;
    }

    // 继续播放
    resume () {
    	this.play();
    }
}


export default Barrage
