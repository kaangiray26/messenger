// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');
importScripts('https://unpkg.com/openpgp@5.11.0/dist/openpgp.min.js');
importScripts('https://cdn.jsdelivr.net/npm/idb@8.0.0/build/umd.js');

// Private key
var privkey = null;

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
async function setup() {
    const db = await idb.openDB('messenger', 1);
    const key = await db.get('keys', 'private');
    privkey = await openpgp.readPrivateKey({ armoredKey: key });
    console.log('Private key retrieved:', privkey);
    console.log('Service Worker Registered');
}

async function handle_message(payload) {
    const title = payload.notification.title;
    const body = payload.notification.body;

    console.log('Decrypting message:', body, "with private key:", privkey);

    // Decrypt message
    const decrypted = await openpgp.decrypt({
        message: await openpgp.readMessage({ armoredMessage: body }),
        decryptionKeys: privkey
    });

    // Customize notification here
    const notificationTitle = title;
    const notificationOptions = {
        body: decrypted.data,
        icon: '/images/person.svg'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
}

// Create an instance of the Firebase messaging service
const messaging = firebase.messaging();
messaging.onBackgroundMessage(handle_message);

// Event handler for notification click
self.addEventListener('notificationclick', function (event) {
    console.log('Notification clicked');
    event.notification.close();
    event.waitUntil(
        clients.openWindow('https://messenger.buzl.uk')
    );
});

setup();