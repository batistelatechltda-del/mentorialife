// src/firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Configuração do Firebase (garanta que as variáveis de ambiente estão corretamente configuradas)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: "G-3QLVFTGVX7" // Opcional, se não for necessário para análise
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Função de inicialização do Firebase
export const initFirebase = () => app;

// Função para solicitar permissão e registrar o token de notificação
export const requestPermissionAndRegisterToken = async (userId) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      const token = await getToken(messaging, { vapidKey });

      if (token) {
        // Envia o token para o backend
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/push/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, token }),
        });

        return token; // Retorna o token registrado
      }
    } else {
      console.warn("Permissão negada para notificações");
      return null;
    }
  } catch (error) {
    console.error("Erro ao obter token FCM:", error);
    return null;
  }
};

// Quando a notificação chega enquanto o app está aberto (foreground)
onMessage(messaging, (payload) => {
  console.log("Notificação recebida no foreground:", payload);

  // Se a permissão de notificação estiver concedida, exibe a notificação
  if (Notification.permission === "granted") {
    const { title, body } = payload.notification || {};
    new Notification(title || "Reminder", { body: body || "" });
  }
});
