// 手势操作封装
// @param container: 绑定手势事件的元素，如不传，则需自己另外绑定实例后的onTouchstart等事件
// @param type: 1(平移)，2(平移加缩放)，3(平移加缩放加旋转)；默认：type = 3
// @param x, y, scale, rotate: 初始化的x, y, scale, rotate；默认：x = 0, y = 0, scale = 1, rotate = 0
// @param onChange: 手势x, y, scale, rotate信息发生变化时的回调函数 @return {x, y, scale, rotate}
// demo
// new Touch({
//     container: document.querySelector('.test'),
//     // isTransform: false,
//     // type: 3,
//     x: 300,
//     y: 300,
//     scale: 3,
//     onChange({x, y, scale, rotate}) {
//         console.log(x, y, scale, rotate)
//     }
// })
export default class Touch {
    constructor(options) {
        this.init(options);
        if (this.container) {
            this.setEvents();
            this.updateContainer();
        }
    }
    init(data) {
        this.x = 0;
        this.y = 0;
        this.scale = 1;
        this.rotate = 0;
        this.type = 3;
        this.isTransform = true;
        if (data) {
            for (let key in data) {
                this[key] = data[key];
            }
        }
        this.onePoint = {
            x: 0,
            y: 0
        };
        this.preOnePoint = null;
        this.twoPoint = {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 0
        };
        this.preTwoPoint = null;
    }
    onTouchstart(e) {
        if (e.touches.length < 2) {
            this.onePoint.x = e.touches[0].pageX;
            this.onePoint.y = e.touches[0].pageY;
        } else {
            this.twoPoint.x1 = e.touches[0].pageX;
            this.twoPoint.y1 = e.touches[0].pageY;
            this.twoPoint.x2 = e.touches[1].pageX;
            this.twoPoint.y2 = e.touches[1].pageY;
        }
    }
    onTouchmove(e) {
        if (e.touches.length < 2 || this.type === 1) {
            if (!this.preOnePoint) {
                this.onePoint.x = e.touches[0].pageX;
                this.onePoint.y = e.touches[0].pageY;
                this.preTwoPoint = null;
            }
            this.preOnePoint = {
                x: this.onePoint.x,
                y: this.onePoint.y
            }
            this.onePoint.x = e.touches[0].pageX;
            this.onePoint.y = e.touches[0].pageY;
            let onePointDiffX = this.onePoint.x - this.preOnePoint.x;
            let onePointDiffY = this.onePoint.y - this.preOnePoint.y;

            this.x += onePointDiffX;
            this.y += onePointDiffY;
            if (this.container) {
                this.updateContainer()
            }
            if (this.onChange) {
                this.onChange({
                    x: this.x,
                    y: this.y,
                    scale: this.scale,
                    rotate: this.rotate,
                });
            }
        } else if (e.touches.length > 1) {
            if (this.type !== 1) {
                if (!this.preTwoPoint) {
                    this.twoPoint.x1 = e.touches[0].pageX;
                    this.twoPoint.y1 = e.touches[0].pageY;
                    this.twoPoint.x2 = e.touches[1].pageX;
                    this.twoPoint.y2 = e.touches[1].pageY;
                    this.preOnePoint = null;
                }
                this.preTwoPoint = {
                    x1: this.twoPoint.x1,
                    y1: this.twoPoint.y1,
                    x2: this.twoPoint.x2,
                    y2: this.twoPoint.y2
                };
                this.twoPoint.x1 = e.touches[0].pageX;
                this.twoPoint.y1 = e.touches[0].pageY;
                this.twoPoint.x2 = e.touches[1].pageX;
                this.twoPoint.y2 = e.touches[1].pageY;

                let scale = this.countScale();
                this.scale += scale;

                if (this.scale < 0) {
                    this.scale = 0;
                }

                if (this.type === 3) {
                    let rotate = this.countRotate();
                    this.rotate += rotate;
                }
                if (this.container) {
                    this.updateContainer()
                }
                if (this.onChange) {
                    this.onChange({
                        x: this.x,
                        y: this.y,
                        scale: this.scale,
                        rotate: this.rotate,
                    });
                }
            }
        }
    }
    onTouchend(e) {
        if (e.touches.length < 1) {
            this.preOnePoint = null;
            this.preTwoPoint = null;
        }
    }
    countScale() {
        // 计算距离，缩放
        let preDistance = Math.sqrt(Math.pow((this.preTwoPoint.x1 - this.preTwoPoint.x2), 2) + Math.pow((this.preTwoPoint.y1 - this.preTwoPoint.y2), 2));
        let curDistance = Math.sqrt(Math.pow((this.twoPoint.x1 - this.twoPoint.x2), 2) + Math.pow((this.twoPoint.y1 - this.twoPoint.y2), 2));

        let scale = (curDistance - preDistance) * 0.005;

        return scale
    }
    countRotate() {
        // 计算角度，旋转
        let vector1 = {
            x: this.preTwoPoint.x2 - this.preTwoPoint.x1,
            y: this.preTwoPoint.y2 - this.preTwoPoint.y1
        };
        let vector2 = {
            x: this.twoPoint.x2 - this.twoPoint.x1,
            y: this.twoPoint.y2 - this.twoPoint.y1
        };

        let cos = (vector1.x * vector2.x + vector1.y * vector2.y) / (Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y) * Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y));
        // 修正，否则Math.acos(cos)为NaN
        if (cos < -1) {
            cos = -1
        } else if (cos > 1) {
            cos = 1
        }
        let angle = Math.acos(cos) * 180 / Math.PI;
        let direction = (vector1.x * vector2.y - vector2.x * vector1.y) > 0 ? 1 : -1;
        angle = direction * angle;

        return angle;
    }
    setEvents() {
        this.container.addEventListener('touchstart', this.onTouchstart.bind(this));
        this.container.addEventListener('touchmove', this.onTouchmove.bind(this));
        this.container.addEventListener('touchend', this.onTouchend.bind(this));
        this.container.addEventListener('touchcancel', this.onTouchend.bind(this));
    }
    updateContainer() {
        if (this.isTransform) {
            this.container.style.transform = `translate(${this.x}px, ${this.y}px) scale(${this.scale}) rotate(${this.rotate}deg)`
            this.container.style.webkitTransform = `translate(${this.x}px, ${this.y}px) scale(${this.scale}) rotate(${this.rotate}deg)`
        }
    }
}