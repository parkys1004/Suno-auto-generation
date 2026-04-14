import { initializeApp } from "firebase/app";
import { initializeFirestore, getDocFromServer, doc } from "firebase/firestore";
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

// Firestore 초기화 (Long Polling 강제 설정으로 연결성 개선)
export const adminDb = initializeFirestore(adminApp, {
  experimentalForceLongPolling: true
});

export const auth = getAuth(adminApp);

// Firestore 연결 테스트
async function testConnection() {
  try {
    // 서버에서 직접 문서를 가져오려고 시도하여 연결 상태 확인
    await getDocFromServer(doc(adminDb, 'test', 'connection'));
    console.log("Firebase connection successful.");
  } catch (error: any) {
    if (error.message && error.message.includes('the client is offline')) {
      console.error("Firebase configuration error: The client is offline or cannot reach the backend. Please check if Firestore is enabled for this project.");
    } else {
      // 다른 에러는 무시 (테스트용 문서가 없을 수 있으므로)
      console.log("Firebase connection test completed (document may not exist).");
    }
  }
}
testConnection();
