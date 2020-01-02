// 单个粒子
function Snow(data) {
    this.initData = data;
    this.bitmap = new createjs.Bitmap(data.image);
    this.init(data);
}
Snow.prototype = {
    // 粒子初始化
    init: function(data) {
        this.bitmap.alpha = data.alpha || 1;
        this.bitmap.regX = this.bitmap.getBounds().width / 2;
        this.bitmap.regY = this.bitmap.getBounds().height / 2;
        this.bitmap.x = data.x;
        this.bitmap.y = data.y;
        this.bitmap.scale = data.scale || 1;
        this.bitmap.rotation = data.rotation || 0;
        this.vx = data.vx || 0;
        this.vy = data.vy || 0;
        this.vrotation = data.vrotation || 0;
    },
    // 粒子位置更新
    update: function() {
        this.bitmap.x += this.vx;
        this.bitmap.y += this.vy;
        this.bitmap.rotation += this.vrotation;
        this.bitmap.rotation >= 360 && (this.bitmap.rotation = 0);
        this.bitmap.rotation <= -360 && (this.bitmap.rotation = 0);
    }
}

// 场景
function snowScene(config) {
    this.stage = new createjs.Stage(config.canvas);
    this.stage.canvas.width = config.width || window.innerWidth;
    this.stage.canvas.height = config.height || window.innerHeight;
    this.images = config.images;
    this.snowImages = new createjs.LoadQueue(false);

    this.position = config.position || 'top';
    this.vx = config.vx || [-2, 2];
    this.vy = config.vy || [1, 4];
    this.interval = config.interval || 20;

    this.snows = [];
    this.pool = {};

    // 是否不断旋转
    this.noRotation = config.noRotation;

    // this.init();
}   
snowScene.prototype = {
    // 场景初始化
    init: function(callback) {
        createjs.Ticker.timingMode = createjs.Ticker.RAF;
        createjs.Ticker.framerate = 60;
        // createjs.Ticker.setFPS(60);

        this.time = 0;

        this.stage.update();

        if (callback) {
            this.snowImages.on('complete', callback);
        }
        this.snowImages.loadManifest(this.images);
    },
    // 获取随机整数
    getRandomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    },
    getRandom: function(a, b) {
        return Math.random() * (b - a) + a;
    },
    removeSnow: function(snow) {
        this.stage.removeChild(snow.bitmap);
        if (!this.pool[snow.type]) {
            this.pool[snow.type] = [];
        }
        this.pool[snow.type].push(snow);
        for (var i = 0; i < this.snows.length; i++) {
            if (snow == this.snows[i]) {
                this.snows.splice(i, 1);
                return;
            }
        }
    },
    createSnow: function() {
        var snowData = {};
        var id = this.images[this.getRandomInt(0, this.images.length - 1)].id;
        snowData.image = this.snowImages.getResult(id);
        snowData.vx = this.getRandom(this.vx[0], this.vx[1]);
        snowData.vy = this.getRandom(this.vy[0], this.vy[1]);
        // snowData.vx = Math.random() > 0.5 ? snowData.vx : -snowData.vx;
        // snowData.vy = Math.random() > 0.5 ? snowData.vy : -snowData.vy;
        
        if (Math.abs(snowData.vx) < 1 && Math.abs(snowData.vy) < 1) {
            snowData.vx += snowData.vx / Math.abs(snowData.vx);
            snowData.vy += snowData.vy / Math.abs(snowData.vy);
        }
        snowData.alpha = this.getRandom(50, 100) / 100;
        snowData.scale = this.getRandom(50, 100) / 100;
        snowData.rotation = this.getRandom(0, 360);

        var imgWidth = snowData.image.width * snowData.scale;
        var imgHeight = snowData.image.height * snowData.scale;
        if (this.position === 'top') {
            snowData.x = this.getRandom(imgWidth / 2, this.stage.canvas.width - imgWidth / 2);
            snowData.y = -imgHeight / 2;
        } else if (this.position === 'bottom') {
            snowData.x = this.getRandom(imgWidth / 2, this.stage.canvas.width - imgWidth / 2);
            snowData.y = this.stage.canvas.height + imgHeight / 2;
        } else {
            snowData.x = this.position[0];
            snowData.y = this.position[1];
        }

        if (!this.noRotation) {
            (snowData.vx >= 0) && (snowData.vrotation = 1);
            (snowData.vx < 0) && (snowData.vrotation = -1);
        } else {
            snowData.vrotation = 0;
        }

        if (this.pool[id] && this.pool[id].length) {
            var snow = this.pool[id].pop();
            snow.init(snowData);
        } else {
            var snow = new Snow(snowData);
        }
        snow.type = id;
        this.snows.push(snow);
        this.stage.addChild(snow.bitmap);
    },
    start: function() {
        var _this = this;
        this.paused = false;
        createjs.Ticker.addEventListener('tick', function() {
            if (!_this.snowImages.getResult(_this.images[0].id)) {
                return;
            }
            _this.tick();
        });
    },
    stop: function() {
        createjs.Ticker.reset();
    },

    pause: function() {
        this.paused = true;
    },
    resume: function() {
        this.paused = false;
    },
    tick: function() {
        if (!this.paused) {
            this.time++;
        }
        if (this.time === this.interval) {
            this.time = 0;
            this.createSnow();
        }
        for (var i in this.snows) { 
            var rectRange = this.snows[i].bitmap.getTransformedBounds();
            if(rectRange.x > this.stage.canvas.width || rectRange.x < -rectRange.width || rectRange.y > this.stage.canvas.height || rectRange.y < -rectRange.height) {
               // this.snows[i].init(this.initSnowData());
               this.removeSnow(this.snows[i]);
            } else {
               this.snows[i].update();
            }
        }
        if (this.snows.length) {
            this.stage.update();
        }
    },
}


// demo
// this.scene = new snowScene({
//     width: 750,
//     height: window.innerHeight * 750 / window.innerWidth,
//     canvas: "recordCanvas",
//     images: [
//         {
//             id: "fu_01",
//             src: "http://n.sinaimg.cn/gd/20190912/grcbank/icon_fu_01.png"
//         },
//         {
//             id: "fu_02",
//             src: "http://n.sinaimg.cn/gd/20190912/grcbank/icon_fu_02.png"
//         },
//         {
//             id: "fu_03",
//             src: "http://n.sinaimg.cn/gd/20190912/grcbank/icon_fu_03.png"
//         },
//         {
//             id: "fu_04",
//             src: "http://n.sinaimg.cn/gd/20190912/grcbank/icon_fu_04.png"
//         }
//     ],
//     // 参数position: 'top' / 'bottom' / [x, y];
//     position: [375, 375],
//     // 参数interval，发射时间间隙，单位帧
//     interval: 10,
//     vx: [-4, 4],
//     vy: [-4, 4],
// });
// this.scene.init(() => {
//     this.scene.start();

//     setTimeout(() => {
//         this.scene.pause();
//     }, 4000);

//     setTimeout(() => {
//         this.scene.resume();
//     }, 8000);

//     setTimeout(() => {
//         this.scene.stop();
//     }, 12000);
// });
