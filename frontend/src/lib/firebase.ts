// frontend/src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: "G-3QLVFTGVX7",
};

let messagingInstance: Messaging | null = null;

export function initFirebase(): Messaging {
  const app = initializeApp(firebaseConfig);
  messagingInstance = getMessaging(app);
  return messagingInstance;
}

export async function requestPermissionAndRegisterToken(authToken: string) {
  console.log("🔍 Iniciando registro de token FCM...");
  try {
    if (!messagingInstance) initFirebase();

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, message: "Permission denied" };
    }

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = await getToken(messagingInstance!, { vapidKey });

    console.log("✅ Token gerado:", token);

    if (!token) return { success: false, message: "No token received" };

    // Envia token ao backend
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    console.log("Backend URL:", backendUrl);

    const res = await fetch(
      `${backendUrl}/client/push/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token, platform: "web" }),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Erro ao registrar no backend:", errorText);
      return { success: false, message: "Failed to register on backend" };
    }

    console.log("✅ Token enviado ao backend com sucesso");
    return { success: true, token };
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("requestPermission error", err.message);
      return { success: false, message: err.message };
    } else {
      console.error("requestPermission error", err);
      return { success: false, message: String(err) };
    }
  }
}

export function onForegroundMessage(callback: (payload: any) => void) {
  if (!messagingInstance) initFirebase();

  onMessage(messagingInstance!, (payload) => {
    callback(payload);
  });
}
