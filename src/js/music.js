// 音乐
export default {
    // 背景音乐id
    bgMusic: 'bgMusic',

    // 是否自动播放
    autoplay: true,

    // 其他音效ids
    otherMusic: [],

    // 播放背景音乐
    playBgm() {
        const bgMusic = document.getElementById(this.bgMusic);
        if (bgMusic) {
            bgMusic.play();
            bgMusic.parentNode.classList.add('active');
        }
    },

    // 停止播放音乐
    stopBgm(reset) {
        const bgMusic = document.getElementById(this.bgMusic);
        if (bgMusic) {
            bgMusic.pause();
            bgMusic.parentNode.classList.remove('active');
            if (reset) {
                bgMusic.currentTime = 0;
            }
        }
    },

    toggleBgm() {
        const bgMusic = document.getElementById(this.bgMusic);
        if (bgMusic) {
            if (bgMusic.paused) {
                this.playBgm();
            } else {
                this.stopBgm();
            }
        }
    },

    // 音乐播放处理入口
    main () {
        const bgMusic = document.getElementById(this.bgMusic);

        if (bgMusic) {
            bgMusic.parentNode.addEventListener('click', (event) => {
                event.stopPropagation();
                document.removeEventListener('click', this._clickHandler);
                this.toggleBgm();
            });
        }

        if (this.autoplay) {
            this.playBgm();
        }
        document.addEventListener('click', this._clickHandler = () => {
            if (this.autoplay && bgMusic && bgMusic.paused) {
                this.playBgm();
            }

            for (let i = 0; i < this.otherMusic.length; i++) {
                let other = document.getElementById(this.otherMusic[i]);
                other.play();
                other.pause();
            }
            document.removeEventListener('click', this._clickHandler);
        });
    }
}
