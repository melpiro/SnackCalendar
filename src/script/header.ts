
import {UserManager} from "./user-manager";



export class HeaderManager{

    public constructor(userManager: UserManager) {
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            userManager.logout().then(() => {
                // Redirect to login page after successful logout
                window.location.href = '/login.html';
            });
        });
    }
}