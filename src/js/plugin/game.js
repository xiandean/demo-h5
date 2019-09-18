/**
 * @param {Object} options
 * 例：
 * {
 *      {String} canvas 画布id 或者 画布本身
 *      {Number} width 宽度，默认屏幕宽度
 *      {Number} height 高度，默认屏幕高度
 *      ... 自定义属性
 * }
 *
 * @method
 * 例：
 * {
 *      预加载资源：load({ manifest, onProgress, onComplete })
 *      获取图片资源：getResource(id)
 *      直接获取bitmap：getBitmap(id)
 *      获取已有对象：getObject(id)
 *      添加对象，parent为指定父级对象：addObject(objectData, parent)
 *      批量添加对象：addObjects(objectDataArr)
 *      渲染页面：render()
 *      运行自动刷帧：run()
 *      暂停：pause()
 *      游戏状态：isPause()
 *      继续：resume()
 *      停止：stop()
 *      显示帧率：showFPS()
 *      打印已有对象层次：consoleLog(object)
 *      碰撞检测：hitTest(object, target, isAll) isAll是否全部都在碰撞区 注意层次问题
 *      获取随机整数：getRandomInt(min, max)
 *      在物品底层填充alpha为0.01的shape，用以解决点击事件中点击透明处不触发的问题：fixClickArea(obj)
 * }
 *
 * 监听事件
 * 例：
 * {
 *      onLoadProgress(e)
 *      onLoadComplete(e)
 *      onTick(e)
 *      onStop()
 * }
 * 
 */

// 游戏类的基本框架
// { canvas, width = window.innerWidth, height = window.innerHeight, onLoadProgress, onLoadComplete, manifest, model, controller, onTick }
export default class Game {
    constructor(options = {}) {
        for (let key in options) {
            this[key] = options[key];
        }
        this.width = this.width || window.innerWidth;
        this.height = this.height || window.innerHeight;
        if (this.webgl) {
            this.stage = new createjs.StageGL(this.canvas);
        } else {
            this.stage = new createjs.Stage(this.canvas);
        }
        this.stage.canvas.width = this.width;
        this.stage.canvas.height = this.height;
        if (this.webgl) {
            this.stage.updateViewport(this.width, this.height);
        }

        createjs.Touch.enable(this.stage);
        createjs.Ticker.timingMode = createjs.Ticker.RAF;
        createjs.Ticker.framerate = 60;
        // createjs.Ticker.setFPS(60);

        this._paused = true;
        this._loader;
        // 事件监听
        this._callbacks = {};

        this.objects = {};
    }

    // 注册事件
    on(name, callback) {
        this._callbacks[name] = this._callbacks[name] || [];
        this._callbacks[name].push(callback);
    }

    // 注销事件
    off(name, callback) {
        const callbacks = this._callbacks[name];
        if (callbacks && callbacks instanceof Array) {
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

    // 预加载资源
    load({ manifest, onProgress, onComplete } = {}) {
        let images = manifest || this.manifest;
        let onLoadProgress = onProgress || this.onLoadProgress;
        let onLoadComplete = onComplete || this.onLoadComplete;
        this._loader = new createjs.LoadQueue(false, '', true);
        this._loader.addEventListener('error', (e) => {
            console.log(e);
            this.trigger('loadError', e);
        });
        this._loader.addEventListener('progress', (e) => {
            let progress = Math.floor(e.progress * 100);
            if (onLoadProgress) {
                onLoadProgress.call(this, progress);
            } else {
                this.trigger('loadProgress', progress);
            }
        });
        this._loader.addEventListener('complete', (e) => {
            if (onLoadComplete) {
                onLoadComplete.call(this, this._loader);
            } else {
                this.trigger('loadComplete', this._loader);
            }
        });

        this._loader.loadManifest(images);
    }

    // 获取图片资源
    getResource(id) {
        return this._loader.getResult(id);
    }

    // 直接获取bitmap
    getBitmap(id) {
        return new createjs.Bitmap(this.getResource(id));
    }

    // 获取已有对象
    getObject(id) {
        return this.objects[id];
    }

    // 添加对象，parent为指定父级对象
    createObject(objectData, parent) {
        let id = objectData.id;
        let type = objectData.type;
        let object = null;
        if (objectData.object) {
            // 添加已有对象
            object = objectData.object;
        } else if (objectData.spriteData) {
            let spriteData = {};
            spriteData.images = [];
            for (let i = 0; i < objectData.spriteData.images.length; i++) {
                spriteData.images.push(this.getResource(objectData.spriteData.images[i]));
            }
            spriteData.frames = objectData.spriteData.frames;
            spriteData.animations = objectData.spriteData.animations;

            let spriteSheet = new createjs.SpriteSheet(spriteData);
            object = new createjs.Sprite(spriteSheet);
        } else if (objectData.shapeData) {
            object = new createjs.Shape();
            for (let key in objectData.shapeData) {
                let param = objectData.shapeData[key];
                let arr = [];
                if (param instanceof Array) {
                    arr = param;
                } else {
                    arr.push(param);
                }
                object.graphics[key].apply(object.graphics, arr);
            }
        } else if (objectData.textData) {
            object = new createjs.Text(objectData.textData.text, objectData.textData.font, objectData.textData.color);
        } else if (objectData.image) {
            let image = this.getResource(objectData.image);
            object = new createjs.Bitmap(image);
        } else {
            object = new createjs.Container();
        }

        if (objectData.props) {
            for (let key in objectData.props) {
                object[key] = objectData.props[key];
            }
        }

        object.objectId = id;
        if (type) {
            object.type = type;
        }

        if (parent) {
            parent.addChild(object);
        } else if (objectData.parent || typeof objectData.parent == 'undefined') {
            parent = this.objects[objectData.parent] || this.stage;
            parent.addChild(object);
        }

        if (objectData.children) {
            for (let i = 0; i < objectData.children.length; i++) {
                let child = objectData.children[i];
                this.createObject(child, object);
            }
        }
        if (id) {
            this.objects[id] = object;
        }

        return object;
    }

    // 批量添加对象
    createObjects(objectDataArr) {
        let objects = [];
        for (let i = 0; i < objectDataArr.length; i++) {
            objects.push(this.createObject(objectDataArr[i]));
        }
        return objects;
    }

    // 渲染页面
    render() {
        this.stage.update();
    }

    // // 游戏初始化
    // init() {
    //     if (this.model) {
    //         // 初始化的model数据
    //         this.addObjects(this.model);
    //     }
    //     if (this.controller) {
    //         // 游戏逻辑控制器
    //         this.controller();
    //     }

    //     this.render();
    // }

    // 游戏重置
    // reset() {
    //     this.stop();
    //     this.stage.removeAllChildren();
    //     this.objects = {};
    //     this.init();
    // }
    onTick(e) {
        this.trigger('tick', e);
    }
    // 运行自动刷帧
    run() {
        this._paused = false;
        createjs.Ticker.addEventListener('tick', this._ticking = (e) => {
            if (!this._paused) {
                if (this.onTick) {
                    this.onTick(e);
                }
                this.render();
            }
        });
    }

    // 暂停
    pause() {
        this._paused = true;
    }

    // 游戏状态
    isPause() {
        return this._paused;
    }

    // 继续
    resume() {
        this._paused = false;
    }

    // 停止
    stop() {
        this._paused = true;
        createjs.Ticker.removeEventListener('tick', this._ticking);
        if (this.onStop) {
            this.onStop();
        }
    }

    // 显示帧率
    showFPS() {
        this._fpsText = new createjs.Text('', 'Bold 20px Arial', '#f00');
        this._fpsText.y = 24;
        this.stage.addChild(this._fpsText);
        // this._fpsText.cache(0, 0, 80, 24);
        this._fpsText.addEventListener('tick', () => {
            this._fpsText.text = Math.round(createjs.Ticker.getMeasuredFPS()) + 'fps';
            // this._fpsText.cache(0, 0, 80, 24);
        });
    }

    // 打印已有对象层次
    consoleLog(object) {
        let result = {};
        if(!object) {
            object = this.stage;
        }
        loop(object, result);
        function loop(object, result) {
            result.id = object.objectId || object.id || 'stage';
            if(object.type) {
                result.type = object.type;
            }
            result.x = object.x;
            result.y = object.y;
            result.regX = object.regX;
            result.regY = object.regY;
            result.scaleX = object.scaleX;
            result.scaleY = object.scaleY;
            result.rotation = object.rotation;
            result.alpha = object.alpha;
            result.visible = object.visible;
            if(object.parent) {
                result.parent = object.parent.objectId || object.parent.id || 'stage';
            }
            if(object.getTransformedBounds()) {
                result.width = object.getTransformedBounds().width;
                result.height = object.getTransformedBounds().height;
            }
            console.group(result.id + '：');
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

    // 碰撞检测，isAll是否全部都在碰撞区
    hitTest(object, target, isAll) {
        let boundsA, boundsB;
        if (object.getTransformedBounds) {
            boundsA = object.getTransformedBounds();
        } else {
            boundsA = {x: object.x, y: object.y, width: object.width || 0, height: object.height || 0};
        }

        if(target.getTransformedBounds) {
            boundsB = target.getTransformedBounds();
        }else {
            boundsB = {x: target.x, y: target.y, width: target.width || 0, height: target.height || 0};
        }

        if (object.parent && target.parent && object.parent != target.parent) {
            let positionA  = object.parent.localToGlobal(0, 0);
            boundsA.x = boundsA.x + positionA.x;
            boundsA.y = boundsA.y + positionA.y;
            let positionB = target.parent.localToGlobal(0, 0);
            boundsB.x = boundsB.x + positionB.x;
            boundsB.y = boundsB.y + positionB.y;
        }

        if (isAll) {
            return boundsA.x > boundsB.x && boundsA.x + boundsA.width < boundsB.x + boundsB.width && boundsA.y > boundsB.y && boundsA.y + boundsA.height < boundsB.y + boundsB.height;
        } else {
            return !(boundsA.x > boundsB.x + boundsB.width || boundsA.x + boundsA.width < boundsB.x || boundsA.y > boundsB.y + boundsB.height || boundsA.y + boundsA.height < boundsB.y)
        }
    }

    // 获取随机整数
    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min)
    }

    // 在物品底层填充alpha为0.01的shape，用以解决点击事件中点击透明处不触发的问题
    fixClickArea(obj) {
        let object = obj || this;
        let bounds = object.getBounds();
        let shape = new createjs.Shape();
        shape.graphics.beginFill('#fff').drawRect(0, 0, bounds.width, bounds.height);
        shape.alpha = 0.01;
        object.addChildAt(shape, 0);
    }
};