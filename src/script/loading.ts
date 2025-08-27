
import { animate, JSAnimation, stagger } from 'animejs';


export class Loading {

    private animation: JSAnimation | null = null;
    private timeout: NodeJS.Timeout | null = null;

    public constructor() {
    }


    public show() {
        this.timeout = setTimeout(() => {
            document.getElementById('loading')!.classList.remove('hidden');
            if (this.animation) {
                this.animation.restart();
            } else {
                this.animation = animate('.spinner', {
                    rotate: '1turn',
                    translateY: ['-600%', '-600%'],
                    duration: 2000,
                    delay: stagger(200),
                    easing: 'inOutQuad',
                    loop: true,
                });
            }
        }, 100);
    }

    public hide() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        
        document.getElementById('loading')!.classList.add('hidden');
        if (this.animation) {
            this.animation.pause();
            this.animation = null;
        }
    }
}
