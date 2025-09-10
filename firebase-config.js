// Firebase configuration for VT Basketball
const firebaseConfig = {
    apiKey: "AIzaSyDnW_VGhEjObMYYRHGsEDo76EH9y3ebJgo",
    authDomain: "vtmbb-gameday.firebaseapp.com",
    databaseURL: "https://vtmbb-gameday-default-rtdb.firebaseio.com",
    projectId: "vtmbb-gameday",
    storageBucket: "vtmbb-gameday.firebasestorage.app",
    messagingSenderId: "1012073356538",
    appId: "1:1012073356538:web:7a41a93d00920d4d00bd43"
};

// Initialize Firebase
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };
