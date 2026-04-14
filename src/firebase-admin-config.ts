import { initializeApp } from "firebase/app";
import { getFirestore, getDocFromServer, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import firebaseConfig from "../firebase-applet-config.json";

// 별도 이름으로 초기화하여 충돌 방지
const adminApp = initializeApp(firebaseConfig, "admin-system");
export const adminDb = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId);
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
