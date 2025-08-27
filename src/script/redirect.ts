
import {UserManager} from './user-manager';




export function redirectToLogin(userManager:UserManager, or: string = ""): void {
    // wait for userManager to be initialized
    if (!userManager.isInitialized()) {
        setTimeout(() => {
            redirectToLogin(userManager, or);
        }
        , 100);
        return;
    }

    if (userManager.isLoggedIn()) {
        
        if (or != ""){
            window.location.href = or;
        }
    } else {
        window.location.href = '/login.html';
    }
}