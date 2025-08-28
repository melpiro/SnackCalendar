
import {UserManager} from "../user-manager";
import { DatabaseManager } from "../database";
import {errorManager} from "../error-manager";
import { Loading } from "../loading";
import { auth, db } from "../init-firebase";


var databaseManager: DatabaseManager;
var userManager: UserManager;
var loading: Loading;

window.addEventListener('load', () => {
    databaseManager = new DatabaseManager(db);
    userManager = new UserManager(auth, databaseManager);
    loading = new Loading();
    
    document.getElementById('signup-btn')?.addEventListener('click', () => {
        errorManager.handleErrors(signup);
    });


});


async function signup() {

    const username = (document.getElementById('name') as HTMLInputElement);
    const email = (document.getElementById('email') as HTMLInputElement);
    const password1 = (document.getElementById('password1') as HTMLInputElement);
    const password2 = (document.getElementById('password2') as HTMLInputElement);
    const username_value = username.value.trim().toLowerCase();
    const email_value = email.value.trim().toLowerCase();


    // Perform validation checks, if invalid set error class
    if (!username_value) {
        username.classList.add('error');
        throw new Error("Veuillez entrer un prénom.");
    } // check that name only contains letters or - and do not start or end with -
    if (!/^[a-zA-Z][a-zA-Z-]*[a-zA-Z]$/.test(username_value) || username_value.includes('--')) {
        username.classList.add('error');
        throw new Error("Le prénom ne doit contenir que des lettres, ou des tirets.");
    } // check that name is between 2 and 20 characters
    if (username_value.length < 2 || username_value.length > 20) {
        username.classList.add('error');
        throw new Error("Le prénom doit contenir entre 2 et 20 caractères.");
    } // check that name does not start with a number
    if (!email_value || !email_value.includes('@')) {
        email.classList.add('error');
        throw new Error('Veuillez entrer une adresse e-mail valide.');
    } if (!password1.value || !password2.value) {
        password1.classList.add('error');
        password2.classList.add('error');
        throw new Error('Veuillez entrer un mot de passe.');
    } // check that password is at least 6 characters long
    if (password1.value.length < 6 || password2.value.length < 6) {
        password1.classList.add('error');
        password2.classList.add('error');
        throw new Error('Le mot de passe doit contenir au moins 6 caractères.');
    } // check that passwords match
    if (password1.value !== password2.value) {
        password1.classList.add('error');
        password2.classList.add('error');
        throw new Error('Les mots de passe ne correspondent pas.');
    }

    try {
        loading.show();
        await userManager.signup(username_value, email_value, password1.value);
        loading.hide();
        // Redirect to home page after successful signup
        window.location.href = '/home.html';
    } catch (error) {
        let err:Error = error as Error;
        if (err.message.includes('auth/invalid-email')) {
            email.classList.add('error');
            throw new Error('Adresse e-mail invalide. Veuillez entrer une adresse e-mail valide.');
        }
        console.error('Erreur lors de l\'inscription:', err);
        throw new Error('Une erreur est survenue lors de l\'inscription :' + err.message);
    }
}
