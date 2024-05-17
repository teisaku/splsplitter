// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAh-s6UqPTU614UgT1H2_dJhpunT3buzfI",
  authDomain: "simplesplitter1.firebaseapp.com",
  projectId: "simplesplitter1",
  storageBucket: "simplesplitter1.appspot.com",
  messagingSenderId: "949275358143",
  appId: "1:949275358143:web:00a13b212f2fe59dbd270a",
  measurementId: "G-NEBY6CCDTQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
