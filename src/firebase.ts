import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import config from "../firebase-applet-config.json";

// Set databaseId appropriately
const firebaseConfig = {
  ...config,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-611be57c-6418-4ea4-bf89-4d3375dd3067");
export const auth = getAuth(app);
