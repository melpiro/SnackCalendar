
import * as FA from 'firebase/auth';
import * as FS from 'firebase/firestore';
import { format_name } from './utils';


export type CalendarElement = {
    user: string;
    snacks: string[];
    time: number;
    as: string|null;
};

export type UserData = {
    name: string;
    role: string;
    email: string;
};

export type Calendar = { [id: number] : CalendarElement; }

export type UserSet = { [id: string] : UserData; }

export class DatabaseManager{

    private db: FS.Firestore;

    public constructor(db: FS.Firestore) {
        this.db = db;
    }

    public async add_new_user_data(user: string, name:string, email:string): Promise<void> {
        await FS.setDoc(FS.doc(this.db, 'users', user), {
            name: name,
            role: 'user',
            email: email
        });
    }

    public async get_role(user: string): Promise<string> {
        const docRef = FS.doc(this.db, 'users', user);
        const docSnap = await FS.getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data().role;
        } else {
            console.error("User", user, "has no role, setting to user");
            return 'user';
        }
    }

    private static time_to_id(time: number): number {
        return Math.floor(time / (86400000) ); // 1000 * 60 * 60 * 24 convert to day number
    }
    private static id_to_time(id: number): number {
        return id * 86400000; // 1000 * 60 * 60 * 24 convert to milliseconds
    }

    public async participate(user: string, time:number, snacks:string[], participate_as:string): Promise<boolean> {
        time = DatabaseManager.time_to_id(time)

        // check if an user already participated
        const docRef = FS.doc(this.db, 'calendar', time.toString());
        const docSnap = await FS.getDoc(docRef);
        if (docSnap.exists()) {
            return false; // user already participated
        }

        let data= {
            user: user,
            snacks: snacks,
            time: time
        };
        if (participate_as != '') {
            data['as'] = participate_as;
        }
        

        await FS.setDoc(FS.doc(this.db, 'calendar', time.toString()), data).catch((error) => {
            console.error("Error adding document: ", error);
            return false;
        });
        return true;
    }

    public async modify_participation(user: string, time:number, snacks:string[], participate_as:string): Promise<boolean> {
        time = DatabaseManager.time_to_id(time)

        await FS.setDoc(FS.doc(this.db, 'calendar', time.toString()), {
            user: user,
            snacks: snacks,
            time: time,
            as: participate_as
        }).catch((error) => {
            console.error("Error adding document: ", error);
            return false;
        });
        return true;
    }

    public async cancel_participation(time:number): Promise<boolean> {
        time = DatabaseManager.time_to_id(time)

        await FS.deleteDoc(FS.doc(this.db, 'calendar', time.toString())).catch((error) => {
            console.error("Error deleting document: ", error);
            return false;
        });
        return true;
    }

    public async get_calendar(start:number, end:number): Promise<Calendar> {
        start = DatabaseManager.time_to_id(start);
        end = DatabaseManager.time_to_id(end);

        const calendarRef = FS.collection(this.db, 'calendar');
        const q = FS.query(calendarRef, FS.where('time', '>=', start), FS.where('time', '<=', end));
        const querySnapshot = await FS.getDocs(q);
        const calendar:  Calendar  = {};
        querySnapshot.forEach((doc) => {
            const data = doc.data() as CalendarElement;
            const time = DatabaseManager.id_to_time(data.time);
            calendar[time] = {
                user: data.user,
                snacks: data.snacks,
                time: data.time,
                as: null
            };
            if (data.hasOwnProperty('as')) {
                calendar[time].as = data.as;
            }
        });
        return calendar;
    }

    public async get_username(id: string): Promise<string> {
        
        const docRef = FS.doc(this.db, 'users', id);
        const docSnap = await FS.getDoc(docRef);
        if (docSnap.exists()) {
            return format_name(docSnap.data().name);
        } else {
            console.error("No such document!");
            return undefined;
        }
    }

    public async getAllUsers(): Promise<UserSet> {
        const usersRef = FS.collection(this.db, 'users');
        const querySnapshot = await FS.getDocs(usersRef);
        const users: UserSet = {};
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            users[doc.id] = {
                name: data.name,
                role: data.role,
                email: data.email
            };
        });
        return users;
    }

    public async update_user_name(id: string, name: string): Promise<void> {
        const userRef = FS.doc(this.db, 'users', id);
        await FS.updateDoc(userRef, {
            name: name
        }).catch((error) => {
            console.error("Error updating document: ", error);
            throw error;
        });
    }

};