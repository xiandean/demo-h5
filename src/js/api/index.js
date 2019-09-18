import jsonp from './jsonp.js'
import user from './user.js'

export default {
    async getUserInfo() {
        let res = await jsonp({
            url: 'http://interface.gd.sina.com.cn/gdif/zhongqiu201909/ty.html',
            data: {
                openid: user.openid
            }
        })
        console.log(res)
        if (res.error === 10000) {
            return res.data
        } else {
            return Promise.reject(res.error);
        }
    },
    async submitInfo(data) {
        data.openid = user.openid;
        let res = await jsonp({
            url: 'http://interface.gd.sina.com.cn/gdif/zhongqiu201909/bm.html',
            data
        })
        console.log(res)
        return res;
    },
    async getAvatarBase64(img) {
        let res = await jsonp({
            url: 'http://interface.gd.sina.com.cn/gdif/grcbank201901/base64.html',
            data: {
                img
            }
        })
        console.log(res)
        if (res.error === 10000) {
            return res.data
        } else {
            throw new Error('异常操作')
        }
    },
}