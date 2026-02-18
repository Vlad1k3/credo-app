import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDclwAjqyL9WLTurwfI49eX6TsGgixYQJs",
  authDomain: "credo-tool.firebaseapp.com",
  projectId: "credo-tool",
  storageBucket: "credo-tool.firebasestorage.app",
  messagingSenderId: "800329907089",
  appId: "1:800329907089:web:8d59a569536b57f1dc3830",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
