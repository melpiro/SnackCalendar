// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDYueDkNN2VSpqhx3Ay8y-55tpV-Gvu9OU",
  authDomain: "snack-calender.firebaseapp.com",
  projectId: "snack-calender",
  storageBucket: "snack-calender.firebasestorage.app",
  messagingSenderId: "324029725043",
  appId: "1:324029725043:web:b1e5e698110d901c366d06",
  measurementId: "G-JJ0ZXK5XQX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence)
export const db = getFirestore(app);

console.log("Firebase initialized with config:", firebaseConfig);


