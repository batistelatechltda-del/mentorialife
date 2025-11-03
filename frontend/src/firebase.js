import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: "G-3QLVFTGVX7",
};

// Inicializa o app (seguro para SSR)
const app = initializeApp(firebaseConfig);

// Inicializa o Messaging **somente no navegador**
let messaging;
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (err) {
    console.warn("⚠️ Erro ao inicializar Messaging:", err);
  }
}

// Exporta inicializador
export const initFirebase = () => app;

// Solicita permissão e registra o token
export const requestPermissionAndRegisterToken = async (userId) => {
  if (typeof window === "undefined") return null; // evita SSR crash

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Permissão negada para notificações");
      return null;
    }

    // Aguarda o Service Worker registrar antes de continuar
    const registration = await navigator.serviceWorker.ready;

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });

    console.log("✅ Token gerado:", token);

    if (token) {
      // Usando a URL configurada no .env.local
      const backendUrl = process.env.NEXT_PUBLIC_BASE_URL_SERVER;
      console.log("Backend URL:", backendUrl); // Verifique a URL no console

      await fetch(`${backendUrl}/api/push/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, token }),
      });
    }

    return token;
  } catch (error) {
    console.error("❌ Erro ao obter token FCM:", error);
    return null;
  }
};

// Recebe mensagens em foreground
export const listenForForegroundMessages = () => {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log("📩 Notificação recebida:", payload);

    if (Notification.permission === "granted") {
      const { title, body } = payload.notification || {};
      new Notification(title || "Nova mensagem", { body });
    }
  });
};
