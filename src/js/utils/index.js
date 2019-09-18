/**
 * [图片加载]
 * @param  {[String]}  options.src         [图片地址]
 * @param  {Boolean} options.crossOrigin [是否跨域，图片合成用到]
 * @return {[promise]}
 */
export const loadImage = ({ src, crossOrigin = false }) => {
    return new Promise((resolve, reject) => {
        let img = new Image()
        img.onload = () => {
            resolve(img)
        }
        img.onerror = () => {
            reject(img.src)
        }
        if (crossOrigin) {
            img.crossOrigin = '*'
        }
        img.src = src
    })
}

/**
 * [图片预加载]
 * @param  {[Array(String | {id, src})]} )   images    [图片地址数组]
 * @param  {[Function]} onComplete  [回调]
 * @param  {[Boolean]} crossOrigin [图片是非跨域]
 * @return {[Array]}             [图片数组]
 */
export const loadImages = async({ images = [], onProgress = function() {}, onComplete = function() {}, crossOrigin = false }) => {
    let count = 0
    let resultArray = []
    let resultObjects = {}
    const total = images.length

    if (!total) {
        onProgress(100)
        onComplete(resultArray)
        return resultArray
    }

    let promiseArr = images.map(image => {
        const src = image.src ? image.src : image
        return loadImage({ src, crossOrigin }).then((img) => {
            count++
            let progress = Math.floor(count / total * 100)
            onProgress(progress)
            if (image.id) {
                resultObjects[image.id] = img
            } else {
                resultArray.push(img)
            }
        })
    })
    try {
        await Promise.all(promiseArr)
        let result = resultArray.length ? resultArray : resultObjects
        onComplete(result)
        return result
    } catch (e) {
        console.error(`onerror: ${e}`)
    }
}

// 获取随机整数
export const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

// 获取url中的get参数
export const getQueryString = (name) => {
    const reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i')
    const url = window.location.search.replace(/&amp;(amp;)?/g, '&')
    const r = url.substr(1).match(reg)

    if (r !== null) {
        return decodeURIComponent(r[2])
    }

    return null
}

// 是否在微信上打开
export const isWeixin = () => {
    const ua = navigator.userAgent.toLowerCase()

    if (ua.match(/MicroMessenger/i) == 'micromessenger') {
        return true
    } else {
        return false
    }
}

export const switchPage = (next, current, animation) => {
    return new Promise(resolve => {

        let nextPage = next ? document.querySelector(next) : null;
        let currentPage = current ? document.querySelector(current) : null;

        let nextDone = nextPage ? false : true;
        let currentDone = currentPage ? false : true;

        let nextAnimation = animation ? typeof(animation) === 'string' ? animation : animation.enter ? animation.enter : '' : '';
        let currentAnimation = animation ? typeof(animation) === 'string' ? animation : animation.leave ? animation.leave : '' : '';

        if (nextPage) {
            if (nextAnimation && !nextPage.classList.contains('active')) {
                let event = (e) => {
                    if (e.target !== nextPage) {
                        return false;
                    }
                    nextPage.classList.remove(`${nextAnimation}-enter`);
                    nextPage.removeEventListener('webkitAnimationEnd', event);
                    nextDone = true;
                    if (currentDone) {
                        if (currentPage && !currentAnimation) {
                            currentPage.classList.remove('active');
                        }
                        resolve();
                    }
                };

                nextPage.classList.add(`${nextAnimation}-enter`, 'active');
                nextPage.addEventListener('webkitAnimationEnd', event);
            } else {
                nextPage.classList.add('active');
                nextDone = true;
                if (currentDone) {
                    resolve();
                }
            }
        } else {
            nextDone = true;
        }

        if (currentPage) {
            if (currentAnimation && currentPage.classList.contains('active')) {
                let event = (e) => {
                    if (e.target !== currentPage) {
                        return false;
                    }
                    currentPage.classList.remove(`${currentAnimation}-leave`, 'active');
                    currentPage.removeEventListener('webkitAnimationEnd', event);
                    currentDone = true;
                    if (nextDone) {
                        resolve();
                    }
                };

                currentPage.classList.add(`${currentAnimation}-leave`);
                currentPage.addEventListener('webkitAnimationEnd', event);
            } else {
                if (!nextAnimation) {
                    currentPage.classList.remove('active');
                }
                currentDone = true;
                if (nextDone) {
                    resolve();
                }
            }
        } else {
            currentDone = true;
        }
    });
}
