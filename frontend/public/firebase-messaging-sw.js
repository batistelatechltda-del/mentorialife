// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAaGeLnBQ8iArOgd_gW7iVkCdtv50F8B4o",
  authDomain: "mentoria-2330b.firebaseapp.com",
  projectId: "mentoria-2330b",
  storageBucket: "mentoria-2330b.firebasestorage.app",
  messagingSenderId: "1079803716485",
  appId: "1:1079803716485:web:caca16eae8d9ead029daec",
  measurementId: "G-3QLVFTGVX7"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  // Customize notification here
  const title = payload.notification?.title || 'Reminder';
  const options = {
    body: payload.notification?.body || '',
    data: payload.data || {},
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
  event.waitUntil(clients.openWindow(urlToOpen));
});
