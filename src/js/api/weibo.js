import jsonp from './jsonp.js'
import user from './user.js'

export default {
    async getUserInfo() {
        let res = await jsonp({
            url: 'http://interface.gd.sina.com.cn/gdif/weibo/uid.html'
        })
        console.log(res)
        if (res.error === 10000) {
            user.openid = res.data.uid
            user.name = res.data.name
            user.avatar = res.data.image_url

            return user
        } else {
            window.location.href = 'https://passport.weibo.cn/signin/login?entry=mweibo&r=' + window.location.href
        }
    }
}