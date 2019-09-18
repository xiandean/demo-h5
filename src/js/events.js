import { switchPage } from './utils';

export default {
    preventDefault () {
        document.addEventListener('touchmove', (event) => {
            event.preventDefault();
        }, {
        	passive: false
        });
    },

    // 修复ios微信收回键盘后页面不回退的bug
    fixedInputBug () {
        let elements = document.querySelectorAll('input, textarea, select')
        let isFocus = false
        for (let  i = 0, len = elements.length; i < len; i++) {
            let element = elements[i]
            element.addEventListener('blur', () => {
                isFocus = false
                setTimeout(() => {
                    if (!isFocus) {
                        document.body.scrollTop -= 0
                    }
                }, 0)
            })

            element.addEventListener('focus', () => {
                isFocus = true
            })
        }
    },

    querySelectorAll(select, cb) {
        let selectors = document.querySelectorAll(select);
        if (cb) {
            for (let i = 0; i < selectors.length; i++) {
                let selector = selectors[i];
                cb(selector, i);
            }
        }
        return selectors;
    },

    // 初始化swiper
    initSwiper() {
        let _this = this;
        this.swiper = new Swiper ('.swiper-container', {
            loop: true,
            effect: 'fade',
            // preventClicks: false,
            // preventClicksPropagation: true,
            // fadeEffect: {
            //     crossFade: true,
            // },
            followFinger: false,
            // on: {
            //     slideChange: function() {
            //         if (_this.swiper) {

            //         }
            //     }
            // }
        });
        document.querySelector('.swiper-prev').addEventListener('touchstart', () => {
            this.swiper.slidePrev();
        });
        document.querySelector('.swiper-next').addEventListener('touchstart', () => {
            this.swiper.slideNext();
        });
    },

    // 创建海报二维码
    makeQrcode(url) {
        if (!this.qrcode) {
            this.qrcode = new QRCode(document.getElementById("qrcode"), {
                width: 110,
                height: 110,
                correctLevel: QRCode.CorrectLevel.L,
                // colorDark: '#34b9dc',
            });
        }

        this.qrcode.makeCode(url);

    },

    // 创建图片
    createPhoto() {

        document.querySelector('.page-merge').classList.add('active');
        // let url = `${this.link}?id=${this.serverId}&oid=${user.openid}`;
        // this.makeQrcode(url);

        html2canvas(document.querySelector('.page-merge .poster-demo'), {
            useCORS: true,
            logging: false,
            backgroundColor: 'transparent',
            scale: 1,
        }).then((canvas) => {
            let data = canvas.toDataURL();
            document.querySelector('.page-merge').classList.remove('active');
            document.querySelector('.poster-demo-src img').src = data;

            this.switchPage('.page-poster', '.page-photo', 'fade');
        });
    },

    // 设置上传框
    setUpload() {
        this.pc = new PhotoClip('#clipArea', {
            // size: [615, 852],
            outputSize: [566, 413],
            adaptive: ['100%', '100%'],
            file: '#chooseButton',
            // view: '#view',
            ok: '.upload-btn',
            rotateFree: true,
            style: {
                maskColor: 'none',
                maskBorder: 'none',
            },
            // maxZoom: 1,
            loadStart: () => {
                console.log('开始读取照片');
            },
            loadComplete: () => {
                console.log('照片读取完成');
            },
            done: (src) => {
                console.log(src);

                // this.loading = weui.loading('上传中');
                this.upload(src);
                
            },
            errorMsg: {
                noImg: '请上传图片！',
            },
            fail: (msg) => {
                console.log(msg);
                // weui.alert(msg);
            }
        });
    },
    // 上传base64图片
    async upload(base64) {
        let img = base64.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
        let res = await fetch({
            url: 'http://o.gd.sina.com.cn/market/c/interfacelanshenghuo201603/hengqin_img_add',
            method: 'post',
            data: {
                img,
            }
        })
        console.log(res)
        if (res.error === 0) {
            return res.data;
        }
    },

    main () {
        this.preventDefault();
        this.fixedInputBug();


        // switchPage('.page-loading').then(res => console.log('ok'));
    }
}
