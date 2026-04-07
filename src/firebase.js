import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCdvR0RHyvIuIg6wYdmUmuxMritJz-V2CQ",
  authDomain: "messages-38cc9.firebaseapp.com",
  projectId: "messages-38cc9",
  storageBucket: "messages-38cc9.firebasestorage.app",
  messagingSenderId: "1089074940238",
  appId: "1:1089074940238:web:e45df8687f06d56f76761f",
  measurementId: "G-1KB4X9M4J9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
