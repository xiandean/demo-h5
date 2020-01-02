class Game {
    // options: { width, height, backgroundColor, canvas, container, autoStart}
    constructor(options = {}) {
        this.width = options.width || window.innerWidth;
        this.height = options.height || window.innerHeight;
        const appConfig = {
            width: this.width,
            height: this.height,
        };
        if (options.backgroundColor) {
            appConfig.backgroundColor = options.backgroundColor;
        } else {
            appConfig.transparent = true;
        }

        if (options.canvas) {
            appConfig.view = options.canvas.getContext ? options.canvas : document.querySelector(options.canvas);
        }

        if (!options.autoStart) {
            appConfig.autoStart = false;
        }

        this.app = new PIXI.Application(appConfig);

        if (!appConfig.view) {
            let container = options.container;
            if (typeof container === 'object') {
                container.appendChild(this.app.view);
            } else if (typeof container === 'string') {
                document.querySelector.appendChild(this.app.view);
            } else {
                document.body.appendChild(this.app.view);
            }
        }

        this.manifest = options.manifest || [];

        // 游戏对象集合
        this.objects = {};
        // 事件监听
        this._callbacks = {};

        this.app.ticker.add(this._ticking = (delta) => {
            this.trigger('tick', delta);
        });
    }

    // 注册事件
    on(name, callback) {
        this._callbacks[name] = this._callbacks[name] || [];
        this._callbacks[name].push(callback);
    }

    // 注销事件
    off(name, callback) {
        const callbacks = this._callbacks[name];
        if (callbacks && callbacks instanceof Array && callback) {
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        } else {
            this._callbacks[name] = [];
        }
    }

    // 触发事件
    trigger(name, params) {
        const callbacks = this._callbacks[name];
        if (callbacks && callbacks instanceof Array) {
            callbacks.forEach((cb) => {
                cb(params);
            });
        }
    }

    load({manifest, onProgress, onComplete, onError} = {}) {
        PIXI.loader
            .add(manifest || this.manifest)
            .on('progress', (loader) => {
                if (onProgress) {
                    onProgress(loader.progress);
                } else {
                    this.trigger('loadProgress', loader.progress);
                }
            }).on('error', (error) => {
                console.log(error);
                if (onError) {
                    onError(error);
                } else {
                    this.trigger('loadError', error);
                }
            }).load((loader, resources) => {
                if (onComplete) {
                    onComplete(resources);
                } else {
                    this.trigger('loadComplete', resources);
                }
            });
    }

    // 合并添加对象的属性
    addProps(object, props) {
        for (let key in props) {
            let value = props[key];
            if(typeof value === 'object' && object[key]) {
                this.addProps(object[key], value);
            } else {
                object[key] = value;
            }
        }
    }

    // 获取已加载的资源
    getResource(name) {
        return PIXI.loader.resources[name];
    }

    // 获取纹理 textureData: 'name' or textureData: {name: 'name', rectangle: [x, y, width, height]}
    getTexture(textureData) {
        let name = '';
        let rectangle = '';
        if (textureData.name) {
            name = textureData.name;
            rectangle = textureData.rectangle;
        } else {
            name = textureData;
        }
        let texture = this.getResource(name).texture;
        if (rectangle) {
            texture = texture.clone();
            texture.frame = new PIXI.Rectangle(rectangle[0], rectangle[1], rectangle[2], rectangle[3]);
        }
        return texture;
    }

    getObject(name) {
        return this.objects[name];
    }

    // 创建游戏对象
    createObject(objectData) {
        let object = null;
        switch (objectData.type) {
            case 'Object':
                object = objectData.object;
                break;
            case 'AnimatedSprite':
                // spriteData: {
                //     images: ['person01_01', 'person01_02'],
                //     frames: {
                //         width: 271,
                //         height: 298
                //     },
                //     animations: {
                //         run: [0, 1, 'run', 0.05]
                //     }
                // },
                let spriteData = objectData.spriteData;
                let config = spriteData.frames;
                let frames = [];
                for (let i = 0; i < spriteData.images.length; i++) {
                    let image = spriteData.images[i];
                    let width = this.getResource(image).texture.width;
                    let height = this.getResource(image).texture.height;
                    let column = Math.floor(width / config.width);
                    let row = Math.floor(height / config.height);
                    for (let j = 0; j < row; j++) {
                        for (let k = 0; k < column; k++) {
                            let rectangle = [k * config.width, j * config.height, config.width, config.height];
                            frames.push(this.getTexture({
                                name: image,
                                rectangle: rectangle,
                            }));
                        }
                    }
                }
                // for (let i = 0; i < objectData.frames.length; i++) {
                //     frames.push(this.getTexture(objectData.frames[i]));
                // }
                let autoUpdate = objectData.autoUpdate === false ? false : true;
                object = new PIXI.extras.AnimatedSprite(frames, autoUpdate);
                object.animations = spriteData.animations;
                object.playAnimation = function(animation) {
                    this.currentAnimation = null;
                    let currentAnimation = this.animations[animation];
                    this.animationSpeed = currentAnimation[3] || 1;
                    if (currentAnimation[1]) {
                        this.gotoAndPlay(currentAnimation[0]);
                    } else {
                        this.gotoAndStop(currentAnimation[0]);
                    }
                    this.currentAnimation = currentAnimation;
                };
                object.stopAnimation = function(animation) {
                    this.gotoAndStop(this.animations[animation][0]);
                    this.currentAnimation = null;
                };
                object.onFrameChange = function() {
                    if (!this.currentAnimation) {
                        return;
                    }
                    if (this.currentFrame === this.currentAnimation[1] && !this.currentAnimation[2]) {
                        this.stop();
                        if (this.onAnimationEnd) {
                            this.onAnimationEnd(this.currentAnimation);
                        }
                        this.currentAnimation = null;
                        return;
                    } else if (this.currentAnimation[2]) {
                        if (this.currentFrame > this.currentAnimation[1] || this.currentFrame === 0) {
                            this.playAnimation(this.currentAnimation[2]);
                        }
                    }
                };
                break;
            case 'Container':
                object = new PIXI.Container();
                break;
            case 'ParticleContainer':
                // 子级sprite只能用同一个texture，即必须用雪碧图。且子级sprite不能再嵌套多一层sprite
                object = new PIXI.ParticleContainer();
                break;
            case 'Text':
                if (!objectData.style.fontFamily) {
                    objectData.style.fontFamily = 'Arial';
                }
                object = new PIXI.Text(objectData.text, new PIXI.TextStyle(objectData.style));
                break;
            case 'Graphics':
                object = new PIXI.Graphics();
                for (let key in objectData.methods) {
                    let param = objectData.methods[key];
                    let arr = [];
                    if (param instanceof Array) {
                        arr = param;
                    } else {
                        arr.push(param);
                    }
                    object[key].apply(object, arr);
                }
                break;
            default:
                // 默认为Sprite
                object = new PIXI.Sprite(this.getTexture(objectData.texture));
        }
        if (objectData.name) {
            object.name = objectData.name;
            this.objects[object.name] = object;
        }
        if (objectData.props) {
            this.addProps(object, objectData.props);
        }

        if (objectData.children) {
            for (let i = 0; i < objectData.children.length; i++) {
                let child = objectData.children[i];
                object.addChild(this.createObject(child));
            }
        }
        return object;
    }

    createObjects(objectDataArray) {
        let objects = [];
        for (let i = 0; i < objectDataArray.length; i++) {
            objects.push(this.createObject(objectDataArray[i]));
        }
        return objects;
    }

    render() {
        this.app.render();
    }

    run() {
        this.app.start();
    }

    pause() {
        this.app.stop();
    }

    isPaused() {
        return !this.app.ticker.started;
    }

    showFPS() {
        this.FPS = this.createObject({
            name: 'fps',
            type: 'Text',
            text: '',
            style: {
                // fontFamily: 'Arial',
                fontSize: 32,
                fill: 'red'
            },
            props: {
                y: 200
            }
        })
        this.app.stage.addChild(this.FPS);

        this.on('tick', (delta) => {
            this.FPS.text = `${parseInt(this.app.ticker.FPS)}FPS`;
        });
    }

    debug(object) {
        let result = {};
        let stage = null;
        if(!object) {
            object = this.app.stage;
            stage = 'stage'
        }
        loop(object, result);
        function loop(object, result) {
            result.x = object.x;
            result.y = object.y;
            result.width = object.width;
            result.height = object.height;
            result.alpha = object.alpha;
            result.scaleX = object.scale.x;
            result.scaleY = object.scale.y;
            result.rotation = object.rotation;
            result.skewX = object.skew.x;
            result.skewY = object.skew.y;
            console.group(object.name || stage + '：');
            console.dir(result);
            let children = object.children;
            if(children) {
                result.children = [];
                for(let i = 0; i < children.length; i++) {
                    let child = children[i];
                    result.children[i] = {};
                    loop(child, result.children[i]);
                }
            }
            console.groupEnd();
            
        }
        return result;
    }
}

export default Game;

// class MyGame extends Game {
//     constructor(options) {
//         super(options);
//         this.lib = [Scroller, TweenMax, TimelineMax];
//         this.init();
//     }

//     init() {
//         this.on('loadComplete', () => {
//             this.app.stage.addChild(...this.createObjects(this.getData()));

//             this.showFPS();

//             this.render();

//             this.initTimeline();
//             this.initScroller();
//             this.createAnimation(this.getAnimation());

//             console.log(this.timeline)

//             // this.getObject('home_icon').play();

//             // this.timeline.play();
//         });

//         this.load({
//             manifest: this.getManifest()
//         });
//     }

//     getManifest() {
//         let manifest = [
//             {
//                 name: 'home_bg',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/home_bg.jpg',
//             }, {
//                 name: 'home_logo',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/home_logo.png',
//             }, {
//                 name: 'home_icon',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/home_icon.png',
//             }, {
//                 name: 'home_title',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/home_title.png',
//             }, {
//                 name: 'home_float',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/home_float.png',
//             }, {
//                 name: 'page01_float',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page01_float.png',
//             }, {
//                 name: 'content_bg_01',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/content_bg_01.jpg',
//             }, {
//                 name: 'content_bg_02',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/content_bg_02.jpg',
//             }, {
//                 name: 'content_line_0',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/content_line_0.png',
//             }, {
//                 name: 'content_line_00',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/content_line_00.png',
//             }, {
//                 name: 'content_line_02',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/content_line_02.png',
//             }, {
//                 name: 'page01_title',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page01_title.png',
//             }, {
//                 name: 'page01_tip',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page01_tip.png',
//             }, {
//                 name: 'page01_text',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page01_text.png',
//             }, {
//                 name: 'page01_icon',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page01_icon.png',
//             }, {
//                 name: 'page01_mask',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page01_mask.png',
//             }, {
//                 name: 'page02_float',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page02_float.png',
//             }, {
//                 name: 'page02_title',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page02_title.png',
//             }, {
//                 name: 'page02_tip',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page02_tip.png',
//             }, {
//                 name: 'page02_text',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page02_text.png',
//             }, {
//                 name: 'page02_icon',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page02_icon.png',
//             }, {
//                 name: 'page02_mask',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page02_mask.png',
//             }, {
//                 name: 'page02_icon_02',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page02_icon_02.png',
//             }, {
//                 name: 'page02_mask_02',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page02_mask_02.png',
//             }, {
//                 name: 'page03_float',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page03_float.png',
//             }, {
//                 name: 'page03_title',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page03_title.png',
//             }, {
//                 name: 'page03_tip',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page03_tip.png',
//             }, {
//                 name: 'page03_text',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page03_text.png',
//             }, {
//                 name: 'page03_icon',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page03_icon.png',
//             }, {
//                 name: 'page03_mask',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page03_mask.png',
//             }, {
//                 name: 'page03_icon_02',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page03_icon_02.png',
//             }, {
//                 name: 'page03_mask_02',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page03_mask_02.png',
//             }, {
//                 name: 'page04_title',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page04_title.png',
//             }, {
//                 name: 'page04_tip',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page04_tip.png',
//             }, {
//                 name: 'page04_text',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page04_text.png',
//             }, {
//                 name: 'page04_icon',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page04_icon.png',
//             }, {
//                 name: 'page04_mask',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page04_mask.png',
//             }, {
//                 name: 'page04_icon_02',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page04_icon_02.png',
//             }, {
//                 name: 'page04_mask_02',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page04_mask_02.png',
//             }, {
//                 name: 'page04_icon_03',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page04_icon_03.png',
//             }, {
//                 name: 'page04_mask_03',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page04_mask_03.png',
//             }, {
//                 name: 'page05_float',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page05_float.png',
//             }, {
//                 name: 'page05_title',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page05_title.png',
//             }, {
//                 name: 'page05_tip',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page05_tip.png',
//             }, {
//                 name: 'page05_text',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page05_text.png',
//             }, {
//                 name: 'page05_icon',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page05_icon.png',
//             }, {
//                 name: 'page05_mask',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page05_mask.png',
//             }, {
//                 name: 'page05_icon_02',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page05_icon_02.png',
//             }, {
//                 name: 'page05_mask_02',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page05_mask_02_new.png',
//             }, {
//                 name: 'page06_title',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page06_title.png',
//             }, {
//                 name: 'page06_btn',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page06_btn.png',
//             }, {
//                 name: 'page06_bar',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/page06_bar.png',
//             }, {
//                 name: 'content_icon_01',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/content_icon_01.png',
//             }, {
//                 name: 'content_icon_02',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/content_icon_02.png',
//             }, {
//                 name: 'content_icon_03',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/content_icon_03.png',
//             }, {
//                 name: 'content_point_01',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/content_point_01.png',
//             }, {
//                 name: 'content_point_02',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/content_point_02.png',
//             }, {
//                 name: 'content_point_03',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/content_point_03.png',
//             }, {
//                 name: 'content_point_04',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/content_point_04.png',
//             }, {
//                 name: 'content_point_05',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/content_point_05.png',
//             }, {
//                 name: 'icon_mo',
//                 url: 'http://n.sinaimg.cn/gd/20190318/xhw/icon_mo.png',
//             }
//         ];

//         return manifest;
//     }

//     getData() {
//         let data = [
//             {
//                 name: 'homeScene',
//                 type: 'Container',
//                 children: [
//                     {
//                         name: 'home_bg',
//                         texture: 'home_bg',
//                         props: {
//                             width: this.width,
//                             height: this.height,
//                             // alpha: 0,
//                         }
//                     }, {
//                         name: 'home_logo',
//                         texture: 'home_logo',
//                         props: {
//                             x: 29,
//                             y: -60,
//                             // alpha: 0,
//                         }
//                     }, {
//                         name: 'home_float',
//                         texture: 'home_float',
//                         props: {
//                             x: 560,
//                             y: this.height / 2 - 383 + 807,
//                             // alpha: 0,
//                         }
//                     }, {
//                         name: 'home_box',
//                         type: 'Container',
//                         children: [{
//                             name: 'home_icon',
//                             type: 'AnimatedSprite',
//                             frames: ['page01_icon', 'page02_icon', 'page03_icon', 'page04_icon'],
//                             props: {
//                                 // alpha: 0,
//                                 y: 100,
//                                 animationSpeed: 0.1
//                             }
//                         }, {
//                             name: 'home_title',
//                             texture: 'home_title',
//                             props: {
//                                 x: 14 + 750,
//                                 y: 611,
//                                 // alpha: 0,
//                             }
//                         }],
//                         props: {
//                             x: 117,
//                             y: this.height / 2 - 383
//                         }
//                     }
//                 ]
//             }
//         ];

//         return data;
//     }

//     getAnimation() {
//         let animation = [
//             {
//                 target: 'homeScene',
//                 duration: 750,
//                 to: {
//                     x: -750,
//                 }
//             }, {
//                 name: 'page01',
//                 sequence: true,
//                 children: [
//                     {
//                         target: 'home_float',
//                         duration: 100,
//                         to: {
//                             x: '+=20',
//                             useFrames: true,
//                             yoyo: true,
//                             repeat: -1,
//                         }
//                     }, {
//                         target: 'home_icon',
//                         duration: 400,
//                         // delay: 200,
//                         frames: [0, 3],
//                         repeat: -1,
//                     }, {
//                         target: this.getObject('home_title').scale,
//                         duration: 100,
//                         // followed: true,
//                         // delay: 200,
//                         from: {
//                             x: 0,
//                             y: 0,
//                         },
//                         to: {
//                             x: 1,
//                             y: 1,
//                         }
//                     }
//                 ]
//             }
//         ];

//         return animation;
//     }

//     initScroller() {

//         // 第一步，实例化滚动对象
//         this.scroll = new Scroller((left, top, zoom) => {
//             // console.log(left, top);
//             this.onScroll(left)
//             // apply coordinates/zooming
//         }, {
//             bouncing: false,
//             scrollingY: false
//         });

//         // this.scrollWidth = this.getObject('homeScene').width;
//         this.scrollWidth = 1500;
//         this.scroll.setDimensions(this.width, this.height, this.scrollWidth, this.height);
//         // this.scroll.scrollTo(750, 0);

//         this.app.view.addEventListener('touchstart', e => {
//             this.scroll.doTouchStart(e.touches, e.timeStamp);
//         }, false);

//         this.app.view.addEventListener('touchmove', e => {
//             this.scroll.doTouchMove(e.touches, e.timeStamp, e.scale);
//         }, false);

//         this.app.view.addEventListener('touchend', e => {
//             this.scroll.doTouchEnd(e.timeStamp);
//         }, false);

//         this.app.view.addEventListener('touchcancel', e => {
//             this.scroll.doTouchEnd(e.timeStamp);
//         }, false);
//     }

//     initTimeline() {
//         TweenLite.defaultEase = Linear.easeNone;
//         this.timeline = new TimelineMax({
//             useFrames: true,
//             paused: true,
//         });
//         // this.timeline = new AnimationTimeline();
//     }

//     // 创建单个动画
//     createAnimation(animation, timeline, sequence) {
//         let parent = timeline || this.timeline;
//         let action = null;
//         if (animation instanceof Array) {
//             action = new TimelineMax();
//             for (let i = 0; i < animation.length; i++) {
//                 this.createAnimation(animation[i], action, sequence);
//             }
//         } else {
//             if (animation.children && animation.children.length) {
//                 action = new TimelineMax();
//                 this.createAnimation(animation.children, action, animation.sequence);
//             } else {
//                 let object = animation.target;
//                 if (typeof animation.target === 'string') {
//                     object = this.getObject(animation.target);
//                 }

//                 if (animation.frames) {
//                     if (animation.repeat === -1) {
//                         animation.to = {};
//                         animation.to.onUpdate = () => {
//                             if (!object.playing) {
//                                 // object.gotoAndPlay(animation.frames[0]);
//                                 object.play();
//                             }
//                         };
//                         animation.to.onComplete = () => {
//                             // object.gotoAndStop(animation.frames[1]);
//                             object.stop();
//                         }
//                         animation.to.onReverseComplete = () => {
//                             // object.gotoAndStop(animation.frames[0]);
//                             object.stop();
//                         }
//                         object.onFrameChange = (frame) => {
//                             console.log(frame);
//                             if (frame > animation.frames[1] || frame < animation.frames[0]) {
//                                 object.gotoAndPlay(animation.frames[0])
//                             }
//                         }
//                     } else {
//                         object._frameIndex = animation.frames[0];
//                         let step = animation.frames[1] - animation.frames[0] + 1;
//                         let repeat = animation.repeat || 0;
//                         animation.to = {
//                             _frameIndex: animation.frames[1] + step * repeat,
//                             // ease: SteppedEase.config(step * repeat),
//                         };
//                         animation.to.onUpdate = () => {
//                             let frameIndex = Math.floor(object._frameIndex);
//                             frameIndex -= animation.frames[0];
//                             frameIndex %= step;
//                             frameIndex += animation.frames[0];
//                             // let frameIndex = object.frameIndex * repeat % (step + 1);
//                             if (object.currentFrame !== frameIndex) {
//                                 object.gotoAndStop(frameIndex);
//                             }
//                             console.log(frameIndex, this.progress)
//                         }
//                     }
//                 }

//                 if (animation.from || animation.to) {
//                     if (animation.from && animation.to) {
//                         action = TweenMax.fromTo(object, animation.duration || 0, animation.from, animation.to);
//                     } else if (animation.to) {
//                         action = TweenMax.to(object, animation.duration || 0, animation.to);
//                     } else if (animation.from) {
//                         action = TweenMax.from(object, animation.duration || 0, animation.from);
//                     }
//                 }
//             }
//         }
//         if (animation.to && animation.to.repeat === -1) {
//             return;
//         }
//         if (animation.followed || sequence) {
//             parent.add(action, `+=${animation.delay || 0}`);
//         } else {
//             parent.add(action, animation.delay || 0);
//         }
//     }

//     onScroll(progress) {
//         console.log(progress);
//         // 总播放进度
//         this.progress = progress;
//         // this.progress = this.progress < 0 ? 0 : this.progress;
//         // this.progress = this.progress > 1 ? 1 : this.progress;
//         // 控制进度条
//         this.timeline.seek(this.progress, false);
//         // 触发事件
//         this.trigger('progress', this.progress);
//     }
// }

// let game = new MyGame({
//     width: 750,
//     height: window.innerHeight / window.innerWidth * 750,
//     canvas: '#game',
//     autoStart: true
// });


// let game = new MyGame({
//     width: 750,
//     height: window.innerHeight / window.innerWidth * 750,
//     canvas: '#game',
//     autoStart: true,
//     backgroundColor: 0xFFFFFF,
// });
// game.init();