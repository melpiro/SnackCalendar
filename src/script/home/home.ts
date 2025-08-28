
import { Loading } from "../loading";
import { redirectToLogin } from "../redirect";
import { UserManager } from "../user-manager";
import { auth, db } from '../init-firebase';
import { format_name, format_string, html_to_element } from "../utils";
import { Calendar, CalendarElement, DatabaseManager } from "../database";
import { errorManager } from "../error-manager";
import { HeaderManager } from "../header";


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

    var home = new Home();
    loading.show();
    home.createCalendar();

    window.addEventListener('resize', () => {
        home.resize();
    });

});


const DAY_OF_WEEK = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const MONTH = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

function date_diff_days(start: Date, end: Date): number {
    const oneDay = 24 * 60 * 60 * 1000; // hours * minutes * seconds * milliseconds
    return Math.round((end.getTime() - start.getTime()) / oneDay);
}

function date_to_string(date: Date): string {
    return `${DAY_OF_WEEK[date.getDay()]}, ${date.getDate()}`;
}

function round_date(date: Date): Date {
    // Round the date to the nearest day
    return new Date(Math.floor(date.getTime() / (86400000)) * (86400000));
}




class Home {

    loaded_until: Date;
    load_until: Date;

    date_list: Date[] = [];
    html: HTMLElement | null = null;
    html_days: HTMLElement[] = [];

    today: Date = new Date();
    today_index: number = -1;
    selected: Date = new Date();
    selected_index: number = -1;

    db_data:Calendar = {};

    participate_mode_index: number = -1;

    updateCalendarDB_running: boolean = false;

    public constructor() {
        this.loaded_until = new Date();
        let day_of_week = this.loaded_until.getDay();
        this.loaded_until.setDate(this.loaded_until.getDate() - day_of_week + 1);
        this.load_until = new Date();
        // load the next month
        this.load_until.setMonth(this.loaded_until.getMonth() + 2);
        this.today = new Date();

        console.log("ask for user role");

        userManager.roleUpdated().then(role => {
            console.log("User role is", role);
            
            if (role == "admin"){
                this.updateCalendarDB();
                headerManager.show_admin_button();
            }
        });
            
    }


    public async createCalendar() {    
        if (this.html === null) {
            this.html = document.getElementById('calendar') as HTMLElement;
            this.html.innerHTML = `<h2 class="month-year">${MONTH[this.loaded_until.getMonth()]} ${this.loaded_until.getFullYear()}</h2>`;
        }
        let nbDays: number = date_diff_days(this.loaded_until, this.load_until);

        let last_date = new Date(this.loaded_until);
        for (let i = 0; i <= nbDays; i++) {
            let date: Date = new Date(this.loaded_until);
            date.setDate(date.getDate() + i);
            date = round_date(date);

            if (last_date.getMonth() !== date.getMonth()) {
                for (let i = 0; i < 3; i++) {
                    this.html.appendChild(html_to_element(`<div class="filler"></div>`));
                }
                this.html.appendChild(html_to_element(`<h2 class="month-year">${MONTH[date.getMonth()]} ${date.getFullYear()}</h2>`));
            }
            
            if (date.getDay() === 1 || date.getDay() === 2 || date.getDay() === 4 || date.getDay() === 5) {
                let day: HTMLElement = html_to_element(`<div class="day" stage="null"><span class="date">${date_to_string(date)}</span><div class="content"></div></div>`);
                day.childNodes[1].appendChild(this.getNullStageElement(date));
                
                this.html.appendChild(day);
                this.html_days.push(day);
                this.date_list.push(date);
            }
            last_date = date;
        }
        for (let i = 0; i < 3; i++) {
            this.html.appendChild(html_to_element(`<div class="filler"></div>`));
        }
        this.loaded_until = new Date(this.load_until);


        // find index of the date or the next one if dosn't exist
        this.today_index = -1
        for (let i = 0; i < this.date_list.length; i++) {
            let diff = date_diff_days(this.today, this.date_list[i]);
            if (diff >= 0) {
                this.today_index = i;
                break;
            }
        }

        this.selected = new Date(this.today);
        this.selected_index = this.today_index;
        this.updateCalendarDB();
        this.updateCalendarDisplay();
    }

    public resize(){
        this.updateCalendarDisplay();
    }

    private updateCalendarDisplay() {

        let dayElement: HTMLElement = this.html_days[this.selected_index] as HTMLElement;
        dayElement.classList.add('today');        
    }

    private async updateCalendarDB() {
        if (this.updateCalendarDB_running){
            console.log("Warning: updateCalendarDB already running");
            return;
        }

        this.updateCalendarDB_running = true;
        
        let start = this.date_list[0];
        let end = this.date_list[this.date_list.length - 1];

        this.db_data = await databaseManager.get_calendar(start.getTime(), end.getTime());
        
        
        for (let i = 0; i < this.date_list.length; i++) {
            let date: Date = this.date_list[i];
            
            
            if (date.getDay() === 1 || date.getDay() === 2 || date.getDay() === 4 || date.getDay() === 5) {
                let day: HTMLElement = this.html_days[i] as HTMLElement;
                

                if (day.getAttribute("stage") === "null") {
                
                    let day_data = this.db_data[date.getTime()];
                    
                    if (day_data != undefined) {
                        let day_content = day.childNodes[1] as HTMLElement;
                        day_content.innerHTML = ""; // clear the content
                        day_content.appendChild(this.getTookStageElement(date, day_data));
                        day.setAttribute("stage", "took");
                    }
                }
                else if (day.getAttribute("stage") === "took") {
                    let day_data = this.db_data[date.getTime()];
                    console.log(day_data);
                    
                    let day_content = day.childNodes[1] as HTMLElement;
                    day_content.innerHTML = ""; // clear the content
                    if (day_data == undefined) {
                        day_content.appendChild(this.getNullStageElement(date));
                        day.setAttribute("stage", "null");
                    }
                    else{
                        day_content.appendChild(this.getTookStageElement(date, day_data));
                    }
                }
                else{
                    console.log("Impossible to update day in state " + day.getAttribute("stage"));
                    
                }
            }
        }
        this.updateCalendarDB_running = false;
        loading.hide();
    }
        

    private getNullStageElement(date:Date): HTMLElement {
        let el = html_to_element(`<a class="btn valid"> Je participe </a>`);
        el.addEventListener('click', () => {
            this.hide_all_confirm_delete();
            this.switch_participate(date);
        });
        return el;
    }
    private getParticipateStageElement(date:Date, edit=false): NodeListOf<ChildNode> {
        let el =  html_to_element(`<div><span>Vous apportez :</span> <ul></ul> <div class="as-name-container"></div> <div class="buttons"></div></div>`);
        let snacks = [];
        let admin = userManager.getRole() === "admin";
        let as_name_input: HTMLInputElement | null = null;
        if (edit) {
            snacks = this.db_data[date.getTime()].snacks;
        }


        let ul = el.querySelector("ul");
        for (let i = 0; i <= snacks.length; i++) {
            let value = "";
            if (i < snacks.length) {
                value = format_string(snacks[i]);
            }
            let li = html_to_element(`<li><input type="text" class="snacks-input"></li>`);
            let input = li.childNodes[0] as HTMLInputElement;
            input.value = value;
            input.addEventListener('input', () => {
                input_typed(input);
            });
            input.addEventListener('focusout', () => {
                input_focusout(input);
            });
            ul!.appendChild(li);
        }

        if (admin && !edit) {
            let as_name_container = el.querySelector(".as-name-container") as HTMLElement;
            let title = html_to_element(`<span>Participer en tant que :</span>`);
            as_name_input = html_to_element(`<input type="text" class="snacks-input" placeholder="Prénom">`) as HTMLInputElement;
            as_name_container.appendChild(title);
            as_name_container.appendChild(as_name_input);
        }

        let buttons = el.querySelector(".buttons") as HTMLElement;
        let cancel_btn = html_to_element(`<a class="btn edit"> Annuler </a>`);
        let valid_btn = html_to_element(`<a class="btn valid"> Valider </a>`);
        buttons.appendChild(cancel_btn);
        buttons.appendChild(valid_btn);

        cancel_btn.addEventListener('click', () => {
            this.switch_participate(date);
        });
        valid_btn.addEventListener('click', () => {
            let snacks = [];
            for (let li of ul.children) {
                let input = li.childNodes[0] as HTMLInputElement;
                let v = input.value.trim().toLowerCase();
                if (v !== "") {
                    snacks.push(v);
                }
            }
            if (snacks.length === 0) {
                errorManager.showError("Veuillez entrer au moins un goûter.");
                return;
            }

            let participate_as = "";
            
            
            if (!edit){
                if (admin && as_name_input) {
                    participate_as = as_name_input.value.trim();
                }
                errorManager.handleErrors(async ()=>this.participate(date, snacks, participate_as).then(()=>{
                    this.switch_participate(date);
                    this.updateCalendarDB()
                }));
            }
            else {
                if (this.db_data[date.getTime()].as) {
                    participate_as = this.db_data[date.getTime()].as!;
                }
                errorManager.handleErrors(async ()=>this.modify_participation(date, snacks, participate_as).then(()=>{
                    this.switch_participate(date);
                    setTimeout(()=>this.updateCalendarDB()); // wait for the animation to finish
                }));
            }
        });


        function input_typed(thisinput: HTMLInputElement) {
            let value = thisinput.value.trim();
            
            if (value !== "") {
                let index_in_li = -1;
                
                for (let i = 0; i < ul.childNodes.length; i++) {
                    let li_input = ul.childNodes[i].childNodes[0] as HTMLInputElement;
                    if (li_input === thisinput) {
                        index_in_li = i;
                        break;
                    }
                }
                if (index_in_li >= ul.childNodes.length - 1) {
                    // add a new li
                    let new_li = html_to_element(`<li><input type="text" class="snacks-input"></li>`);
                    let new_input = new_li.childNodes[0] as HTMLInputElement;
                    new_input.addEventListener('input', () => input_typed(new_input));
                    new_input.addEventListener('focusout', () => input_focusout(new_input));
                    ul.appendChild(new_li);
                }
            }
        }

        function input_focusout(thisinput: HTMLInputElement) {
            let value = thisinput.value.trim();
            if (value === "") {
                // remove the li
                let index_in_li = -1;
                for (let i = 0; i < ul.childNodes.length; i++) {
                    let li_input = ul.childNodes[i].childNodes[0] as HTMLInputElement;
                    if (li_input === thisinput) {
                        index_in_li = i;
                        break;
                    }
                }
                if (index_in_li < ul.childNodes.length - 1) {
                    ul.removeChild(ul.children[index_in_li]);
                }
            }
        }

        let input = el.querySelector("input") as HTMLInputElement;
        input.addEventListener('input', () => input_typed(input));
        input.addEventListener('focusout', () => input_focusout(input));

        return el.childNodes
    }


    public getTookStageElement(date: Date, data:CalendarElement): HTMLElement {
        let username = usernames[data.user];

        if (data.as){
            username = data.as;
        }
        
        if (username === undefined) {
            this.loadUsername(data.user);
            username = "";
        }

        
        let can_edit = false;
        if (data.user === userManager.getUser().uid || userManager.getRole() === "admin") {
            can_edit = true;
        }



        let el =  html_to_element(`<div><h3><span class="${data.user}">${username}</span> apporte :</h3> <ul></ul> </div>`);

        if (can_edit) {
            let edit_btn = html_to_element(`<a class="btn edit material-symbols-outlined"> edit </a>`);
            let delete_btn = html_to_element(`<a class="btn delete material-symbols-outlined"> delete </a>`);
            let div = document.createElement("div");
            div.classList.add("edit-buttons");
            div.appendChild(edit_btn);
            div.appendChild(delete_btn);
            el.appendChild(div);


            edit_btn.addEventListener('click', () => {
                this.switch_participate(date, true);
                this.hide_all_confirm_delete();
            });

            if (userManager.getRole() !== "admin"){
                delete_btn.addEventListener('click', () => {
                    errorManager.handleErrors(async ()=>this.cancel_participation(date).then(()=>this.updateCalendarDB()));
                });
            } else {
                let confirm = document.createElement("div");
                confirm.classList.add("confirm-delete");
                confirm.classList.add("hidden");
                confirm.innerHTML = `<h3>Confirmer ?</h3>`;
                let yes_btn = html_to_element(`<a class="btn delete"> Oui </a>`);
                let no_btn = html_to_element(`<a class="btn valid"> Non </a>`);
                let btn_div = document.createElement("div");
                btn_div.appendChild(yes_btn);
                btn_div.appendChild(no_btn);
                confirm.appendChild(btn_div);


                delete_btn.addEventListener('click', () => {
                    this.hide_all_confirm_delete();
                    if (this.participate_mode_index !== -1) {
                        this.switch_participate(this.date_list[this.participate_mode_index]);
                    }
                    confirm.classList.remove("hidden");
                });

                no_btn.addEventListener('click', () => {
                    confirm.classList.add("hidden");
                });
                yes_btn.addEventListener('click', () => {
                    errorManager.handleErrors(async ()=>this.cancel_participation(date).then(()=>this.updateCalendarDB()));
                    confirm.classList.add("hidden");
                });
                el.appendChild(confirm);
            }
        }

        let ul = el.querySelector("ul");
        if (data.snacks && data.snacks.length > 0) {
            for (let snack of data.snacks) {
                let li = html_to_element(`<li>${format_string(snack)}</li>`);
                ul!.appendChild(li);
            }
        } else {
            let li = html_to_element(`<li>Vide</li>`);
            ul!.appendChild(li);
        }
        return el;
    }

    public hide_all_confirm_delete(): void {
        let confirms = document.getElementsByClassName("confirm-delete");
        for (let i = 0; i < confirms.length; i++) {
            let confirm = confirms[i] as HTMLElement;
            confirm.classList.add("hidden");
        }
    }


    public switch_participate(date: Date, edit: boolean = false): void {
        let time = date.getTime();
        let index = this.date_list.findIndex(d => d.getTime() === time);
        if (index == -1) return;
        
        let dayElement: HTMLElement = this.html_days[index] as HTMLElement;
        let stage = dayElement.getAttribute("stage");

        if (stage === "null" || stage === "took") {
            if (this.participate_mode_index !== -1) {
                this.switch_participate(this.date_list[this.participate_mode_index]);
            }
            this.participate_mode_index = index;

            if (stage == "took") dayElement.setAttribute("stage", "edit");
            else dayElement.setAttribute("stage", "participate");

            let el = dayElement.childNodes[1] as HTMLElement;
            el.innerHTML = "";
            let childs=this.getParticipateStageElement(date, edit);
            for (let i = 0; i < childs.length; i++) {
                el.appendChild(childs[i]);
            }
        } 
        else if (stage === "participate") {
            dayElement.setAttribute("stage", "null");
            this.participate_mode_index = -1;

            let el = dayElement.childNodes[1] as HTMLElement;
            el.innerHTML = "";
            el.appendChild(this.getNullStageElement(date));
        } 
        else if (stage === "edit") {
            dayElement.setAttribute("stage", "took");
            this.participate_mode_index = -1;

            let el = dayElement.childNodes[1] as HTMLElement;
            el.innerHTML = "";
            el.appendChild(this.getTookStageElement(date, this.db_data[date.getTime()]));
        }
        else {
            console.warn(`Unknown stage: ${stage}`);
        }

    }

    private async participate(date: Date, snacks: string[], participate_as:string): Promise<void> {  
        if (!await databaseManager.participate(userManager.getUser().uid, date.getTime(), snacks, participate_as)) {
            throw new Error("Impossible de participer à ce goûter, veuillez réessayer plus tard.");
        }
    }

    private async modify_participation(date: Date, snacks: string[], participate_as:string): Promise<void> {
        let user = this.db_data[date.getTime()].user;
        if (!await databaseManager.modify_participation(user, date.getTime(), snacks, participate_as)) {
            throw new Error("Impossible de modifier votre participation à ce goûter, veuillez réessayer plus tard.");
        }
    }

    private async cancel_participation(date: Date): Promise<void> {
        if (!await databaseManager.cancel_participation(date.getTime())) {
            throw new Error("Impossible d'annuler votre participation à ce goûter, veuillez réessayer plus tard.");
        }
    }


    private async loadUsername(id:string){
        if (loading_usernames[id] !== undefined) {
            return; // already loading
        }
        loading_usernames[id] = id; // mark as loading
        let name = await databaseManager.get_username(id);
        if (name === undefined) {
            console.warn(`User with id ${id} not found.`);
            usernames[id] = "Inconnu";
        }
        else {
            usernames[id] = name;
            let elements = document.getElementsByClassName(id);
            for (let i = 0; i < elements.length; i++) {
                let element = elements[i] as HTMLElement;
                element.innerText = usernames[id];
            }
        }   
    }
}

