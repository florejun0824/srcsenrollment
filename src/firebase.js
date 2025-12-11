// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// --- REPLACE THIS OBJECT WITH YOUR OWN FROM FIREBASE CONSOLE ---
const firebaseConfig = {
  apiKey: "AIzaSyD8eJJo2S8TeBN_NxuW3cAoYUfEQ9f8UEw",
  authDomain: "srcs-enrollment.firebaseapp.com",
  projectId: "srcs-enrollment",
  storageBucket: "srcs-enrollment.firebasestorage.app",
  messagingSenderId: "253422473416",
  appId: "1:253422473416:web:70e6e58329964e2caf95fd",
  measurementId: "G-HSSK4FFZQL"
};
// --------------------------------------------------------------

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore (the database)
export const db = getFirestore(app);
export const auth = getAuth(app);