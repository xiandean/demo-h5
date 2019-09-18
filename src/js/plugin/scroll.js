/**
 * @param {Object} options
 * 例：
 * {
 * 		{dom} container 监测注册事件的dom容器
 * 		{boolean} momentum 是否开启惯性 默认false
 * 		{object} limit：{minX, maxX, minY, maxY} 滚动区域限制
 *      {function} onScrollStart 监听滚动开始事件
 *      {function} onScroll 监听滚动事件：@param: { speedX, speedY, x, y}
 * 		{function} onScrollEnd 监听每次滚动结束事件
 * }
 */
export default class Scroll {
    constructor({ container, limit, momentum = false, onScrollStart, onScroll, onScrollEnd }) {
        // 监测注册事件的dom容器
        this.container = container;

        // 是否开启惯性
        this.momentum = momentum;

        // 监听滚动开始事件
        if (onScrollStart) {
            this.onScrollStart = onScrollStart;
        }

        // 监听滚动事件：@param: { speedX, speedY, x, y}
        if (onScroll) {
            this.onScroll = onScroll;
        }

        // 监听滚动结束事件
        if (onScrollEnd) {
            this.onScrollEnd = onScrollEnd;
        }

        // 滚动区域限制
        if (limit) {
            this.limit = limit;
        }

        this.init();
        this.setEvents();
    }

    // 初始化
    init() {
        // 前一次所在的坐标
        this.lastX = 0;
        this.lastY = 0;

        // 当前移动的速度
        this.speedX = 0;
        this.speedY = 0;

        // 前一次移动的速度
        this.lastSpeedX = 0;
        this.lastSpeedY = 0;

        // 移动的总距离
        this.x = 0;
        this.y = 0;

        // 惯性衰减系数
        this.deceleration = 0.96;

        // 惯性计时器
        this.timer = null;
    }

    reset() {
        window.cancelAnimationFrame(this.timer);
        let speedX = -this.x;
        let speedY = -this.y;
        this.init();
        if (this.onScroll) {
            this.onScroll({speedX, speedY, x: this.x, y: this.y})
        }
    }

    setEvents() {
        this.container.addEventListener('touchstart', this.onTouchstart.bind(this));
        this.container.addEventListener('touchmove', this.onTouchmove.bind(this));
        this.container.addEventListener('touchend', this.onTouchend.bind(this));
        this.container.addEventListener('touchcancel', this.onTouchend.bind(this));
        window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
    }

    // touchstart 处理
    onTouchstart(e) {
        if (this.timer) {
            window.cancelAnimationFrame(this.timer);
            if (this.onScrollEnd) {
                this.onScrollEnd();
            }
        }
        this.lastX = e.changedTouches[0].pageX
        this.lastY = e.changedTouches[0].pageY

        this.speedX = 0;
        this.speedY = 0;

        this.lastSpeedX = this.speedX;
        this.lastSpeedY = this.speedY;

        if (this.onScrollStart) {
            this.onScrollStart();
        }
    }

    // 滚动区域检测处理
    checkBounds() {
        if (this.limit) {
            // 超出最小x值
            if ((this.limit.minX || this.limit.minX === 0) && this.x <= this.limit.minX) {
                this.speedX = this.limit.minX - this.x + this.speedX;
                this.x = this.limit.minX;
            }

            // 超出最大x值
            if ((this.limit.maxX || this.limit.maxX === 0) && this.x >= this.limit.maxX) {
                this.speedX = this.limit.maxX - this.x + this.speedX;
                this.x = this.limit.maxX;
            }

            // 超出最小y值
            if ((this.limit.minY || this.limit.minY === 0) && this.y <= this.limit.minY) {
                this.speedY = this.limit.minY - this.y + this.speedY;
                this.y = this.limit.minY;
            }

            // 超出最大y值
            if ((this.limit.maxY || this.limit.maxY === 0) && this.y >= this.limit.maxY) {
                this.speedY = this.limit.maxY - this.y + this.speedY;
                this.y = this.limit.maxY;
            }
        }
    }

    // touchmove 处理
    onTouchmove(e) {
        let x = e.changedTouches[0].pageX
        let y = e.changedTouches[0].pageY

        this.lastSpeedX = this.speedX
        this.lastSpeedY = this.speedY

        this.speedX = x - this.lastX;
        this.speedY = y - this.lastY;

        this.lastX = x
        this.lastY = y

        this.x += this.speedX
        this.y += this.speedY

        this.checkBounds()

        if (this.onScroll) {
            this.onScroll({speedX: this.speedX, speedY: this.speedY, x: this.x, y: this.y})
        }

    }

    // touchend 处理
    onTouchend(e) {
        if (this.momentum) {
            // 取最后两次touchmove的平均速度
            this.speedX = (this.speedX + this.lastSpeedX) / 2
            this.speedY = (this.speedY + this.lastSpeedY) / 2

            // 速度绝对值小于10，则默认无惯性
            if (Math.abs(this.speedX) < 10 && Math.abs(this.speedY) < 10) {
                if (this.onScrollEnd) {
                    this.onScrollEnd();
                }
                return;
            }
            // 惯性减速
            this.decelerate()
        } else {
            if (this.onScrollEnd) {
                this.onScrollEnd();
            }
        }
    }

    // 惯性减速
    decelerate() {
        // 速度衰减
        this.speedX *= this.deceleration
        this.speedY *= this.deceleration

        // 衰减到小于0.1时停止
        if (Math.abs(this.speedX) < 0.1) {
            this.speedX = 0;
        }
        if (Math.abs(this.speedY) < 0.1) {
            this.speedY = 0;
        }

        this.x += this.speedX
        this.y += this.speedY

        this.checkBounds()

        if (this.onScroll) {
            this.onScroll({speedX: this.speedX, speedY: this.speedY, x: this.x, y: this.y})
        }

        if (this.speedX || this.speedY) {
            this.timer = window.requestAnimationFrame(() => {
                this.decelerate();
            });
        } else {
            if (this.onScrollEnd) {
                this.onScrollEnd();
            }
        }
    }
}
