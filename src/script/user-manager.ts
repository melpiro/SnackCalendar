import { DatabaseManager } from './database';
import * as FA from 'firebase/auth';

export class UserManager {

    private user: FA.User | null = null;
    private initialized: boolean = false;
    private auth: FA.Auth;
    private role: string = 'user';
    private role_updated: boolean = false;
    private databaseManager: DatabaseManager;


    public constructor(auth: FA.Auth, databaseManager: DatabaseManager) {
        console.log('UserManager initialized');

        this.auth = auth;
        this.databaseManager = databaseManager;

        // check if user is already logged in
        FA.onAuthStateChanged(this.auth, (user) => {
            if (user) {
                this.user = user;
                this.databaseManager.get_role(user.uid).then(role => {
                    this.role = role;
                    this.role_updated = true;
                });
            } else {
                this.user = null;
            }
            this.initialized = true;
        });
    }

    public async signup(username: string, email: string, password: string): Promise<FA.User>  {
        try {            
            const userCredential = await FA.createUserWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;
            await FA.updateProfile(user, {
                displayName: username
            });
            this.user = user;
            console.log("Add new user data to database :");
            await this.databaseManager.add_new_user_data(user.uid, username, email);
            return user;
        } catch (error) {
            throw new Error(`Error signing up: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private static isEmail(email: string): boolean {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    }

    public async login(email: string, password: string): Promise<FA.User> {
        if (!UserManager.isEmail(email)) {
            throw new Error('Invalid email format or display name does not match any user.');
        }

        try {
            const userCredential = await FA.signInWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;
            this.user = user;
            
            // this.databaseManager.add_new_user_data(user, user.displayName);
            this.role = await this.databaseManager.get_role(user.uid);
            this.role_updated = true;
            return user;
        } catch (error) {
            throw new Error(`Error logging in: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

    }

    public async logout(): Promise<void> {
        try {
            await FA.signOut(this.auth);
            this.user = null;
            this.role = 'user';
            this.role_updated = false;
        } catch (error) {
            throw new Error(`Error logging out: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public async resetPassword(email: string): Promise<void> {
        try {
            await FA.sendPasswordResetEmail(this.auth, email);
        } catch (error) {
            throw new Error(`Error resetting password: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public isLoggedIn(): boolean {        
        return this.user !== null;
    }
    public getUser(): FA.User | null {
        return this.user;
    }

    public isInitialized(): boolean {
        return this.initialized;
    }


    public async roleUpdated(): Promise<string> {
        // create new promise that resolves when role_updated is true
        async function waiter(){
            if (this.role_updated) {
                return 
            }
            await new Promise(resolve => setTimeout(resolve, 200));
            return waiter.call(this);
        }
        await waiter.call(this);
        return this.role;
    }
    public getRole() : string {
        return this.role;
    }
}

