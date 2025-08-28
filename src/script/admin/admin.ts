import { doc } from "firebase/firestore";
import { DatabaseManager } from "../database";
import { errorManager } from "../error-manager";
import { HeaderManager } from "../header";
import { auth, db } from "../init-firebase";
import { Loading } from "../loading";
import { redirectToLogin } from "../redirect";
import { UserManager } from "../user-manager";
import { format_name, html_to_element } from "../utils";



var databaseManager: DatabaseManager;
var userManager: UserManager;
var headerManager: HeaderManager;
var loading: Loading;

var loading_usernames: { [id: string]: string } = {};
var usernames: { [id: string]: string } = {};

window.addEventListener('load', () => {
    databaseManager = new DatabaseManager(db);
    userManager = new UserManager(auth, databaseManager);
    headerManager = new HeaderManager(userManager);
    loading = new Loading();

    

    redirectToLogin(userManager);
    userManager.roleUpdated().then(role => {
        console.log("User role is", role);
        
        if (role != "admin"){
            window.location.href = "/home.html";
        }
        else {
            headerManager.show_admin_button();
        }
    });

    var admin = new Admin();
    loading.show();
    admin.load_data();

});


class Admin{

    constructor(){

    }

    public async load_data(): Promise<void> {

        let users = await databaseManager.getAllUsers();

        let table = document.getElementById('accounts') as HTMLTableElement;
        table.innerHTML = '';
        let header = table.createTHead();
        let header_row = header.insertRow(0);
        header_row.insertCell(0).outerHTML = "<th>Nom</th>";
        header_row.insertCell(1).outerHTML = "<th>Email</th>";
        header_row.insertCell(2).outerHTML = "<th>Rôle</th>";

        let body = table.createTBody();

        // for key value
        for (let [id, user] of Object.entries(users)) {
            let row = body.insertRow();
            let name_cell = row.insertCell(0)
            name_cell.classList.add('name-cell');
            let name = document.createElement('div');
            name_cell.appendChild(name);
            row.insertCell(1).innerText = user.email;
            row.insertCell(2).innerText = user.role == 'admin' ? 'Administrateur' : 'Utilisateur';
            // let actions = row.insertCell(3);

            name.appendChild(html_to_element(`<span class="name" id="${id}" state="none">${format_name(user.name)}</span>`));
            let edit_btn = html_to_element(`<a class="btn edit material-symbols-outlined">edit</a>`) as HTMLButtonElement;
            name.appendChild(edit_btn);
            
            edit_btn.addEventListener('click', () => this.switch_edit_mode(id, user.name, edit_btn));

        }


        loading.hide();
    }

    private switch_edit_mode(id: string, current_name: string, edit_btn: HTMLButtonElement): void {
        let span = document.getElementById(id) as HTMLSpanElement;
        let state = span.getAttribute('state');
        if (state == 'none') {
            edit_btn.innerText = 'check';
            edit_btn.classList.remove('edit');
            edit_btn.classList.add('valid');

            span.innerHTML = `<input type="text" value="${current_name}" id="input-${id}" />`;
            span.setAttribute('state', 'edit');
        }
        else if (state == 'edit') {
            let input = document.getElementById(`input-${id}`) as HTMLInputElement;
            let new_name = input.value;

            edit_btn.innerText = 'edit';
            edit_btn.classList.remove('valid');
            edit_btn.classList.add('edit');
            span.innerText = format_name(current_name);
            span.setAttribute('state', 'none');

            errorManager.handleErrors(async () => {
                await databaseManager.update_user_name(id, new_name)
                span.innerText = format_name(new_name);
            });

            // remove event listener and add it again to avoid multiple calls
            let clone = edit_btn.cloneNode(true) as HTMLButtonElement;
            edit_btn.parentElement.replaceChild(clone, edit_btn);
            clone.addEventListener('click', () => this.switch_edit_mode(id, new_name, clone));
        }
    }
}