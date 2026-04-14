import { initializeApp } from "firebase/app";
import { getFirestore, getDocFromServer, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAp9pnbnU744Dq-UkywRh0hVClZwMenXT8",
  authDomain: "gen-lang-client-0979707528.firebaseapp.com",
  databaseURL: "https://gen-lang-client-0979707528-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gen-lang-client-0979707528",
  storageBucket: "gen-lang-client-0979707528.firebasestorage.app",
  messagingSenderId: "523555104282",
  appId: "1:523555104282:web:e8b727b2d14a549d9e93a3"
};

// 별도 이름으로 초기화하여 충돌 방지
const adminApp = initializeApp(firebaseConfig, "admin-system");
// Note: Using default database for this project
export const adminDb = getFirestore(adminApp);
export const auth = getAuth(adminApp);

// Firestore 연결 테스트
async function testConnection() {
  try {
    await getDocFromServer(doc(adminDb, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firebase configuration error: The client is offline or cannot reach the backend.");
    }
  }
}
testConnection();
