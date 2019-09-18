import weixin from './api/weixin.js';
import preload from './preload.js';
import events from './events.js';
import music from './music.js';
import { isWeixin } from './utils'

const app = {
    preload,
    music,
    events,
    async share () {
        await weixin.getConfig()
        weixin.setShare({
            title: '分享标题', // 分享标题
            desc: '分享描述', // 分享描述
            imgUrl: 'http://n.sinaimg.cn/gd/xiaopiqi/answer/weixin_share.jpg', // 分享图标
            // callback: function () {}, // 分享成功回调
        })
        if (this.music.autoplay) {
            this.music.playBgm();
        }
    },
    // app主入口
    main () {
        // 微信分享
        if (isWeixin()) {
            this.share();
        }

        // 图片预加载入口
        this.preload.main();

        // 音乐处理入口
        this.music.main();

        // 用户交互事件入口
        this.events.main();
    }
};

app.main();
