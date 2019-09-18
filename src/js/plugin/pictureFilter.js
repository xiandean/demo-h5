import { loadImage } from '../utils';

export default class PictureFilter {
    constructor({src, crossOrigin, resolution = 126, color = [0, 0, 0]}) {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.src = src;
        this.crossOrigin = crossOrigin;
        this.color = color;
        this.resolution = resolution;
        this._needLoad = true;
    }
    async export() {
        if (this._needLoad) {
            this.image = await loadImage({src: this.src, crossOrigin: this.crossOrigin});
            this.canvas.width = this.image.width;
            this.canvas.height = this.image.height;
            this._needLoad = false;
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.image, 0, 0);
        let imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        let length = imageData.data.length / 4;

        for (let i = 0; i < length; i++) {
            let r = imageData.data[i * 4];
            let g = imageData.data[i * 4 + 1];
            let b = imageData.data[i * 4 + 2];
            let a = imageData.data[i * 4 + 3];

            let gray = 0.3 * r + 0.59 * g + 0.11 * b;

            // let color = [255, 255, 255];
            if (gray > this.resolution) {
                r = 255;
                g = 255;
                b = 255;
                a = 0;
            } else {
                r = this.color[0];
                g = this.color[1];
                b = this.color[2];
            }
            imageData.data[i * 4] = r;
            imageData.data[i * 4 + 1] = g;
            imageData.data[i * 4 + 2] = b;
            imageData.data[i * 4 + 3] = a;
        }
        this.ctx.putImageData(imageData, 0, 0);
        return this.canvas.toDataURL('image/png', 1);
    }
    setImage(src, crossOrigin) {
        this.src = src;
        this.crossOrigin = crossOrigin;
        this._needLoad = true;
    }
    setColor(color) {
        this.color = color;
    }
    setResolution(resolution) {
        this.resolution = resolution;
    }
}


// demo
// let pictureFilter = new PictureFilter({src: 'images/test.png', resolution: 126, color: [0, 0, 0]});
// $('#test1').attr('src', await pictureFilter.export());
// pictureFilter.setColor([82, 99, 45]);
// pictureFilter.setResolution(200);
// $('#test2').attr('src', await pictureFilter.export());
// pictureFilter.setColor([201, 17, 67]);
// pictureFilter.setResolution(50);
// pictureFilter.setImage('images/gz.jpg');
// $('#test3').attr('src', await pictureFilter.export());