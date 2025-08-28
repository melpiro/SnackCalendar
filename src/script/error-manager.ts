


class ErrorManager {

    private html: HTMLElement | null = null;
    private timeout_callback: any

    public constructor() {
        
    }

    public load_html(): void {
        this.html = document.getElementById('error-manager');
        if (this.html === null) {
            throw new Error('ErrorManager: HTML element with id "error-manager" not found.');
        }
    }


    public handleErrors(fun: () => Promise<void>): void {
        fun().catch((error) => {
            console.error(error);
            
            if (this.timeout_callback != null) {
                clearTimeout(this.timeout_callback);
            }
            this.html!.classList.remove('hidden');
            this.html!.innerText = error.message || 'Une erreur est survenue. Veuillez réessayer plus tard.';
            this.timeout_callback = setTimeout(() => {
                this.html!.classList.add('hidden');
                this.html!.innerText = '';
            }, 5000);

        });
    }

    public showSuccess(message: string): void {
        if (this.timeout_callback != null) {
            clearTimeout(this.timeout_callback);
        }
        this.html!.classList.remove('hidden');
        this.html!.classList.add('info');
        this.html!.innerText = message;
        this.timeout_callback = setTimeout(() => {
            this.html!.classList.add('hidden');
            this.html!.classList.remove('info');
            this.html!.innerText = '';
        }, 5000);
    }
    public showError(message: string): void {
        if (this.timeout_callback != null) {
            clearTimeout(this.timeout_callback);
        }
        this.html!.classList.remove('hidden');
        this.html!.innerText = message;
        this.timeout_callback = setTimeout(() => {
            this.html!.classList.add('hidden');
            this.html!.innerText = '';
        }, 5000);
    }
}



export var errorManager = new ErrorManager();

window.addEventListener('load', () => {
    errorManager.load_html();
});