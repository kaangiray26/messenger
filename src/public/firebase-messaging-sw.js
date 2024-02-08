// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');
importScripts('https://unpkg.com/browse/openpgp@5.11.0/dist/openpgp.min.js');

// Initialize the Firebase app
firebase.initializeApp({
    apiKey: "AIzaSyAh17S_KmK43c9U85OudQpti_JQ8hdYJn4",
    authDomain: "kaangiray26-messenger.firebaseapp.com",
    projectId: "kaangiray26-messenger",
    storageBucket: "kaangiray26-messenger.appspot.com",
    messagingSenderId: "908221026498",
    appId: "1:908221026498:web:0afd6e2859e0b20876ab5b"
});

// Get the private key from indexedDB
con

// Create an instance of the Firebase messaging service
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
    const title = payload.notification.title;
    const body = payload.notification.body;

    // Customize notification here
    const notificationTitle = title;
    const notificationOptions = {
        body: body,
        icon: '/favicon.svg'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Decrypt message using our private key
async function decrypt(msg) {

}

console.log('Service Worker Registered');