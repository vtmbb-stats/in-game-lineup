// Shared Firebase setup for every page. Loaded as <script type="module" src="firebase.js">.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getDatabase, ref, set, update, remove, push, get, onValue
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import {
    getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyDnW_VGhEjObMYYRHGsEDo76EH9y3ebJgo",
    authDomain: "vtmbb-gameday.firebaseapp.com",
    databaseURL: "https://vtmbb-gameday-default-rtdb.firebaseio.com",
    projectId: "vtmbb-gameday",
    storageBucket: "vtmbb-gameday.firebasestorage.app",
    messagingSenderId: "1012073356538",
    appId: "1:1012073356538:web:7a41a93d00920d4d00bd43"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

window.firebaseDb = {
    ref: (path) => ref(database, path),
    set: (dbRef, value) => set(dbRef, value),
    update: (dbRef, value) => update(dbRef, value),
    remove: (dbRef) => remove(dbRef),
    push: (dbRef, value) => push(dbRef, value),
    // Read once. Resolves to the value at `path`, or null if nothing is there.
    read: async (path) => {
        const snap = await get(ref(database, path));
        return snap.exists() ? snap.val() : null;
    },
    // Subscribe to `path`. callback receives the value (or null). Returns an unsubscribe function.
    watch: (path, callback) => onValue(ref(database, path), (snap) => callback(snap.exists() ? snap.val() : null))
};

// Sign-in stays saved on the device (browser local storage) until "Sign out" is pressed.
const auth = getAuth(app);
window.firebaseAuth = {
    // callback receives the signed-in user's email, or null. Returns an unsubscribe function.
    onChange: (callback) => onAuthStateChanged(auth, (user) => callback(user ? user.email : null)),
    signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
    signOut: () => signOut(auth)
};
