import axios from 'axios'
import qs from 'qs'

export default (options) => {
    let config = {
        method: options.method || 'get',
        baseURL: '/',
        url: options.url
    }

    if (options.data) {
        if (config.method === 'get') {
            config.params = options.data
        } else {
            config.data = qs.stringify(options.data)
        }
    }

    return axios(config)
        .then((res) => {
            return Promise.resolve(res.data)
        })
        .catch((err) => {
            return Promise.reject(err)
        })
}