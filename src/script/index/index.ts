import { DatabaseManager } from "../database";
import { auth, db } from "../init-firebase";
import { redirectToLogin } from "../redirect";
import { UserManager } from "../user-manager";


window.addEventListener('load', () => {

    let databaseManager = new DatabaseManager(db);
    let userManager = new UserManager(auth, databaseManager);

    redirectToLogin(userManager, "home.html");
});
