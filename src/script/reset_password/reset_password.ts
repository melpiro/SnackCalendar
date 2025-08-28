
import {UserManager} from "../user-manager";
import {errorManager} from "../error-manager";
import { auth, db } from "../init-firebase";
import { DatabaseManager } from "../database";
import { Loading } from "../loading";



var databaseManager: DatabaseManager;
var userManager: UserManager;
var loading: Loading;

window.addEventListener('load', () => {
    databaseManager = new DatabaseManager(db);
    userManager = new UserManager(auth, databaseManager);
    loading = new Loading();

    document.getElementById('reset-btn')?.addEventListener('click', () => {
        loading.show();
        errorManager.handleErrors(reset_password);
        loading.hide();
    });
});



async function reset_password() {

    const email = (document.getElementById('email') as HTMLInputElement);

    // Perform validation checks, if invalid set error class
    if (!email.value || !email.value.includes('@')) {
        email.classList.add('error');
        throw new Error('Veuillez entrer une adresse e-mail valide.');
    }

    try {
        await userManager.resetPassword(email.value);
        errorManager.showSuccess('Un e-mail de réinitialisation du mot de passe a été envoyé.');
    } catch (error) {
        let err:Error = error as Error;
        console.error('Erreur lors de l\'inscription:', err);
        throw new Error('Email ou mot de passe incorrect. Veuillez réessayer.');
    }
}
