import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD-RZUtBpYC4DoB5AqTXVfwsWUOP6xE9rQ",
  authDomain: "asset-management-a4351.firebaseapp.com",
  databaseURL: "https://asset-management-a4351-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "asset-management-a4351",
  storageBucket: "asset-management-a4351.firebasestorage.app",
  messagingSenderId: "982021336876",
  appId: "1:982021336876:web:675fbd337aeed07bdcc689"
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

// 익명 인증 시도 (auth != null 규칙을 사용하는 경우 대응)
signInAnonymously(auth).catch((err) => {
  // 익명 인증이 비활성화되어 있는 경우 정상적인 무시
  console.debug("Anonymous auth info:", err.message);
});

