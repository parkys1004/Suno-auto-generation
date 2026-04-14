import { initializeApp } from "firebase/app";
import { initializeFirestore, getDocFromServer, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import firebaseConfig from "../firebase-applet-config.json";

// 별도 이름으로 초기화하여 충돌 방지
const adminApp = initializeApp(firebaseConfig, "admin-system");

// Firestore 초기화 (Long Polling 강제 설정으로 연결성 개선)
// Database ID가 명시되어 있으면 사용, 없으면 (default) 사용
export const adminDb = initializeFirestore(adminApp, {
  experimentalForceLongPolling: true
}, firebaseConfig.firestoreDatabaseId || "(default)");

export const auth = getAuth(adminApp);

// Firestore 연결 테스트
async function testConnection() {
  try {
    // 서버에서 직접 문서를 가져오려고 시도하여 연결 상태 확인
    await getDocFromServer(doc(adminDb, 'test', 'connection'));
    console.log("Firebase connection successful.");
  } catch (error: any) {
    if (error.message && error.message.includes('the client is offline')) {
      console.error("Firebase configuration error: The client is offline or cannot reach the backend.");
      console.error("원인 1: Firebase 콘솔에서 Firestore가 활성화되지 않았을 수 있습니다.");
      console.error("원인 2: API 키에 Firestore 접근 권한이 없을 수 있습니다.");
    } else if (error.message && error.message.includes('not found')) {
      console.error("Firebase configuration error: Database not found.");
      console.error("해결 방법: Firebase 콘솔(https://console.firebase.google.com/)에서 'Firestore Database'를 생성해야 합니다.");
    } else {
      console.log("Firebase connection test completed (document may not exist).");
    }
  }
}
testConnection();
