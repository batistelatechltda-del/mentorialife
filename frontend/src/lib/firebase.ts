// frontend/src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";

// ✅ Configuração Firebase (use suas variáveis de ambiente do .env.local)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: "G-3QLVFTGVX7", // opcional
};

let messagingInstance: Messaging | null = null;

/**
 * Inicializa Firebase e retorna instância de messaging
 */
export function initFirebase(): Messaging {
  const app = initializeApp(firebaseConfig);
  messagingInstance = getMessaging(app);
  return messagingInstance;
}

/**
 * Solicita permissão do navegador e registra token no backend
 */
export async function requestPermissionAndRegisterToken(authToken: string) {
  try {
    if (!messagingInstance) initFirebase();

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, message: "Permission denied" };
    }

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = await getToken(messagingInstance!, { vapidKey });

    if (!token) return { success: false, message: "No token received" };

    // Envia token ao backend
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/client/push/register`,
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
      return { success: false, message: "Failed to register on backend" };
    }

    return { success: true, token };
  } catch (err: unknown) {
    // ✅ Corrige o erro de tipagem do `err`
    if (err instanceof Error) {
      console.error("requestPermission error", err.message);
      return { success: false, message: err.message };
    } else {
      console.error("requestPermission error", err);
      return { success: false, message: String(err) };
    }
  }
}

/**
 * Listener para mensagens recebidas em foreground (app aberto)
 */
export function onForegroundMessage(
  callback: (payload: any) => void // ✅ tipagem explícita do parâmetro
) {
  if (!messagingInstance) initFirebase();

  onMessage(messagingInstance!, (payload) => {
    callback(payload);
  });
}
