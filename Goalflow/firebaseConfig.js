// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDeG4-rZQTHsi50oxyPb8HtrxayKc_nSmE",
  authDomain: "goalflow-8597a.firebaseapp.com",
  projectId: "goalflow-8597a",
  storageBucket: "goalflow-8597a.firebasestorage.app",
  messagingSenderId: "178532607448",
  appId: "1:178532607448:web:e6dcb5582f4a4a33c2fead"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
const firestore = getFirestore(app);
const storage = getStorage(app);

export { auth, firestore, storage };
export default app;
