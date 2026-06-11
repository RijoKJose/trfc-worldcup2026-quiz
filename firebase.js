import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

import {
    getFirestore,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const firebaseConfig = {

    apiKey: "AIzaSyADe7-OmxJvIGv3GRdxU6O5H4UbrOhmq_0",

    authDomain: "trfc-quiz.firebaseapp.com",

    projectId: "trfc-quiz",

    storageBucket: "trfc-quiz.firebasestorage.app",

    messagingSenderId: "503960842068",

    appId: "1:503960842068:web:3711fc131fddd81db022c1",

    measurementId: "G-PWKBQ801SL"

};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

export {

    app,

    auth,

    db,

    signInWithEmailAndPassword,

    signOut,

    onAuthStateChanged,

    serverTimestamp

};