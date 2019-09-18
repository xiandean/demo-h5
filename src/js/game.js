import Game from './plugin/game.js'

class MyGame extends Game {
    constructor(options) {
        super(options);
    }

    init(callback) {
        this.load({
            manifest: this.getManifest()
        });
        this.on('loadComplete', () => {
            this.stage.addChild(...this.createObjects(this.getData()));
            
            // this.showFPS();

            // this.debug();

            this.on('tick', () => {

            });

            this.render();

            this.getObject('person01').gotoAndPlay('run');
            this.getObject('person01').addEventListener('mousedown', (e) => {
                console.log(e);
            });
            callback && callback();
        });
    }

    getManifest() {
        let manifest = [
            {
                id: 'demo',
                src: 'http://n.sinaimg.cn/gd/20190201/grcbank/spring/demo_v1.jpg',
            }, {
                id: 'person01_01',
                src: 'http://n.sinaimg.cn/gd/20190201/grcbank/spring/person_01_01.png',
            }, {
                id: 'person01_02',
                src: 'http://n.sinaimg.cn/gd/20190201/grcbank/spring/person_01_02.png',
            }
        ];

        return manifest;
    }

    getData() {
        let data = [
            {
                id: 'demo',
                children: [
                    {
                        id: 'bg',
                        image: 'demo'
                    }, {
                        id: 'person',
                        children: [
                            {
                                id: 'person01',
                                spriteData: {
                                    images: ['person01_01', 'person01_02'],
                                    frames: {
                                        width: 271,
                                        height: 298
                                    },
                                    animations: {
                                        run: [0, 1, 'run', 0.05]
                                    }
                                },
                                props: {
                                    x: 0,
                                    y: 1300,
                                }
                            }
                        ]
                    }
                ]
            },
        ];

        return data;
    }
}

let game = new MyGame({
    width: 750,
    height: 1496,
    canvas: 'game',
    // webgl: true,
});
game.init(() => {
    game.run();
    game.showFPS();
});
// game.run();
export default game;