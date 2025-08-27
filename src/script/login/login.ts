
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

    document.getElementById('login-btn')?.addEventListener('click', () => {
        loading.show();
        errorManager.handleErrors(login);
        loading.hide();
    });
});



async function login() {

    const email = (document.getElementById('email') as HTMLInputElement);
    const password = (document.getElementById('password') as HTMLInputElement);

    // Perform validation checks, if invalid set error class
    if (!email.value || !email.value.includes('@')) {
        email.classList.add('error');
        throw new Error('Veuillez entrer une adresse e-mail valide.');
    }
    if (!password.value) {
        password.classList.add('error');
        throw new Error('Veuillez entrer un mot de passe.');
    } 

    try {
        await userManager.login(email.value, password.value);
        // Redirect to home page after successful signup
        window.location.href = '/home.html';
    } catch (error) {
        let err:Error = error as Error;
        console.error('Erreur lors de l\'inscription:', err);
        throw new Error('Email ou mot de passe incorrect. Veuillez réessayer.');
    }
}
