
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAoH0WBfLRGgeJ8MQi2OZl4fJOfdTv1kQw",
  authDomain: "my-todo-app-3f57c.firebaseapp.com",
  projectId: "my-todo-app-3f57c",
  storageBucket: "my-todo-app-3f57c.firebasestorage.app",
  messagingSenderId: "685660097896",
  appId: "1:685660097896:web:ce954474579de547b9dadd",
  measurementId: "G-XFXMHBJPSH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// //  enable filestore presist
// import { enableIndexedDbPersistence } from "firebase/firestore";
//  enableIndexedDbPersistence(db).catch((err) => {
//   if (err.code == 'failed-precondition') { 