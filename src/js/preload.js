import {loadImages, switchPage} from './utils';

export default {
    images: [

    ],
    onProgress (progress) {
        console.log(progress);
    },
    onComplete (result) {
        console.log(result);
        // switchPage('.page-home', '.page-loading', 'fade');
    },

    main () {
        // loadImages({images: ['images/bg.jpg'], onComplete: () => {
        //     loadImages({images: this.images, onProgress: this.onProgress, onComplete: this.onComplete});
        // }});
        loadImages({images: this.images, onProgress: this.onProgress, onComplete: this.onComplete});
    }
}
