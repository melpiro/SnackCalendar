
import {UserManager} from "./user-manager";
import { html_to_element } from "./utils";



export class HeaderManager{

    public constructor(userManager: UserManager) {
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            userManager.logout().then(() => {
                // Redirect to login page after successful logout
                window.location.href = '/login.html';
            });
        });
    }

    public show_admin_button(): void {
        let url = window.location.href;

        let calendar_btn = html_to_element(`<a href="/home.html"> Calendrier</a>`);
        let admin_btn = html_to_element(`<a href="/admin.html"> Admin</a>`);

        let nav = document.getElementById('nav');
        nav.innerHTML = '';
        nav.appendChild(calendar_btn);
        nav.appendChild(admin_btn);

        if (url.includes('admin.html')) {
            admin_btn.classList.add('active');
        }
        else {
            calendar_btn.classList.add('active');
        }
    }
}