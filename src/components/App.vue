<template>
    <div class="page container d-flex flex-fill h-100">
        <div class="row row-cols-2 g-0 flex-fill shadow">
            <Hub ref="hub" @open_chat="open_chat" />
            <Chat ref="chat" @videocall="videocall_contact" @voicecall="voicecall_contact" />
        </div>
    </div>
    <VoiceCall ref="voicecall"></VoiceCall>
    <VideoCall ref="videocall"></VideoCall>
</template>

<script setup>
import { ref, onBeforeMount } from 'vue';
import Hub from './Hub.vue';
import Chat from './Chat.vue';
import VoiceCall from './VoiceCall.vue';
import VideoCall from './VideoCall.vue';

import { Peer } from 'peerjs';
import { Dropdown } from 'bootstrap';
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { generateKey, readKey, decrypt, readMessage } from 'openpgp';
import { openDB } from 'idb';
import { store, secrets } from '/js/store.js';

// panes
const hub = ref(null);
const chat = ref(null);

// PeerJS
const peerConfig = {
    iceServers: [
        {
            urls: "turn:standard.relay.metered.ca:80",
            username: "90e794d7186335533be6a215",
            credential: "05ker3YuARTJkdfP",
        },
        {
            urls: "turn:standard.relay.metered.ca:443",
            username: "90e794d7186335533be6a215",
            credential: "05ker3YuARTJkdfP",
        },
    ]
}

// firebase
const server = "https://home.buzl.uk";
const firebaseConfig = {
    apiKey: "AIzaSyAh17S_KmK43c9U85OudQpti_JQ8hdYJn4",
    authDomain: "kaangiray26-messenger.firebaseapp.com",
    projectId: "kaangiray26-messenger",
    storageBucket: "kaangiray26-messenger.appspot.com",
    messagingSenderId: "908221026498",
    appId: "1:908221026498:web:0afd6e2859e0b20876ab5b"
};

// Calls
const videocall = ref(null);
const voicecall = ref(null);

async function generate_secret() {
    return crypto.getRandomValues(new Uint8Array(16)).reduce((p, i) => p + (i % 16).toString(16), '');
}

async function videocall_contact() {
    // Get name
    const contact_secret = store.contact.secret;
    const contact_name = store.contacts.find(item => item.secret == contact_secret).name;

    videocall.value.make_call(contact_secret, contact_name);
}

async function voicecall_contact() {
    // Get name
    const contact_secret = store.contact.secret;
    const contact_name = store.contacts.find(item => item.secret == contact_secret).name;

    voicecall.value.make_call(contact_secret, contact_name);
}

async function open_chat(item) {
    // Load contact
    store.connections[item.secret].notification = 0;
    store.contact = item;

    // Load messages
    const tx = store.db.transaction('messages', 'readonly');
    const msgs = await tx.store.index('secret').getAll(item.secret);
    store.connections[item.secret].items = msgs;

    chat.value.focus_chat();

    // Check contact status
    store.peer._socket._socket.send(JSON.stringify({
        'type': 'CHECK',
        'dst': item.secret
    }))
}

async function handle_incoming_call(call) {
    // Get metadata
    const metadata = call.metadata;

    const caller_id = call.metadata.secret;
    const caller_name = store.contacts.find(item => item.secret == caller_id).name;

    if (metadata.type == "voicecall") {
        voicecall.value.incoming_call(call, caller_id, caller_name);
        return
    }

    if (metadata.type == "videocall") {
        videocall.value.incoming_call(call, caller_id, caller_name);
        return
    }
}

async function handle_incoming_connection(connection) {
    // Data handler
    connection.on('data', async (data) => {
        console.info('Incoming data:', data);
        // Handle handshake
        if (data.type == 'handshake') {
            const found = store.contacts.filter(ct => ct.secret == data.secret).length;
            if (found) return;

            // Hide QR
            hub.value.hide_qr();
            store.connections[data.secret] = {
                conn: null,
                items: [],
                notification: false,
                pubkey: data.pubkey,
                online: false,
                last_seen: 0,
            }
            store.contacts.push({
                name: data.name,
                secret: data.secret,
                pubkey: data.pubkey
            });
            // Add to indexeddb contacts
            const tx = store.db.transaction('contacts', 'readwrite');
            await tx.store.put({
                name: data.name,
                secret: data.secret,
                pubkey: data.pubkey
            });
            // Update results
            hub.value.update_results();
            connection.send({
                type: 'handshake',
                name: secrets.name,
                secret: secrets.secret,
                pubkey: secrets.pubkey.armor()
            })
            return
        }

        // Handle message
        if (data.type === 'message') {
            // Decrypt message
            const decrypted = await decrypt({
                message: await readMessage({ armoredMessage: data.message }),
                decryptionKeys: secrets.privkey
            });

            // Set notification
            const isOpen = store.contact && store.contact.secret == connection.metadata.from;

            if (!isOpen) {
                store.connections[connection.metadata.from].notification += 1;
                create_notification(connection.metadata.from, decrypted.data);
            } else if (!store.focus) {
                create_notification(connection.metadata.from, decrypted.data);
            }

            // Message object
            const time = new Date();
            const msg = {
                secret: connection.metadata.from,
                data: decrypted.data,
                me: false,
                dt: time.toLocaleTimeString('en-GB', {
                    hour: 'numeric', minute: 'numeric'
                }),
                timestamp: +time
            }

            // Add to database
            const tx = store.db.transaction('messages', 'readwrite');
            await tx.store.put(msg);

            // Add to chat
            store.connections[connection.metadata.from].items.push(msg);

            // Scroll down
            if (isOpen) {
                chat.value.scroll_messages();
            }
            return
        }

        // Handle file
        if (data.type === 'file') {

        }
    });

    // Error handler
    connection.on('error', (err) => {
        console.log('Connection incoming error:', err.type, connection.metadata);
    })

    // Close handler
    connection.on('close', () => {
        console.log('Connection incoming closed:', connection.metadata.from);
        store.connections[connection.metadata.from].conn = null;
    })

    // Add connection to list
    if (store.connections[connection.metadata.from]) {
        store.connections[connection.metadata.from].conn = connection;
        return
    }
    store.connections[connection.metadata.from] = {
        conn: connection,
        items: [],
        notification: false,
        pubkey: null,
        online: false,
        last_seen: 0,
    }
}

async function peer_status_check(data) {
    try {
        const parsed = JSON.parse(data);
        if (parsed.type === "CHECK") {
            store.connections[parsed.peer].online = parsed.online;
            store.connections[parsed.peer].last_seen = parsed.last_seen;
        }
    }
    catch (e) {
        console.log('Invalid status check:', data);
    }
}

async function peer_setup() {
    // Create peer
    store.peer = new Peer([secrets.secret], {
        // host: 'localhost',
        // port: 3000,
        // secure: false,
        host: 'home.buzl.uk',
        port: 443,
        secure: true,
        path: '/',
        token: secrets.token,
        config: peerConfig,
    });
    store.peer.on('connection', (connection) => {
        console.log('New incoming connection created:', connection.metadata.from);
        handle_incoming_connection(connection);
    })
    store.peer.on('open', () => {
        console.log('Peer created:', store.peer);

        // Modify onmessage handler
        const func = store.peer._socket._socket.onmessage;
        store.peer._socket._socket.onmessage = (event) => {
            peer_status_check(event.data);
            func(event);
        }
    })
    store.peer.on('close', () => {
        console.log("Peer close event!");
    })
    store.peer.on('call', (call) => {
        console.log("New incoming call");
        handle_incoming_call(call);
    })
}

async function load_database() {
    // IndexedDB
    store.db = await openDB('messenger', 1, {
        upgrade(db) {
            // Keys
            db.createObjectStore('keys');

            // Messages
            const message_store = db.createObjectStore('messages', {
                keyPath: 'message_id',
                autoIncrement: true
            })
            message_store.createIndex('secret', 'secret', { unique: false });
            message_store.createIndex('timestamp', 'timestamp', { unique: false });

            // Contacts
            const contact_store = db.createObjectStore('contacts', {
                keyPath: 'secret'
            })
            contact_store.createIndex('secret', 'secret', { unique: true });
        }
    })

    // Read contacts from indexedDB
    const tx_contacts = store.db.transaction('contacts', 'readonly');
    const data = await tx_contacts.store.getAll();
    if (data) {
        store.contacts = data;
        hub.value.update_results();
    }
    store.contacts.map(item => {
        store.connections[item.secret] = {
            conn: null,
            items: [],
            notification: false,
            pubkey: null,
            online: false,
            last_seen: 0,
        }
    })
}

async function create_notification(secret, body) {
    const name = store.contacts.find(item => item.secret == secret).name;
    Notification.requestPermission().then(async (result) => {
        if (result === "granted") {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(name, {
                    body: body,
                    icon: "/images/person.svg",
                    vibrate: [200, 100, 200, 100, 200, 100, 200],
                    tag: "vibration-sample",
                });
            });
        }
    });
}

async function handle_message(payload) {
    const title = payload.data.title;
    const body = payload.data.body;

    // Decrypt message
    const decrypted = await decrypt({
        message: await readMessage({ armoredMessage: body }),
        decryptionKeys: secrets.privkey
    });

    // Message object
    const time = new Date();
    const msg = {
        secret: title,
        data: decrypted.data,
        me: false,
        dt: time.toLocaleTimeString('en-GB', {
            hour: 'numeric', minute: 'numeric'
        }),
        timestamp: +time
    }

    // Add to database
    const tx = store.db.transaction('messages', 'readwrite');
    await tx.store.put(msg);

    // Set notification
    create_notification(title, decrypted.data);
}

async function firebase_setup() {
    // console.log("Firebase setup...");
    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);
    onMessage(messaging, handle_message);

    // Check if service worker is available
    if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        if (!registration) {
            console.error('Service Worker registration failed:', err);
            return
        }
        console.info('Service Worker registered with scope:', registration.scope);
    }

    // Push notification registration
    if (localStorage.getItem('push')) return;

    console.log('Registering for push notifications...');
    const token = await getToken(messaging, {
        vapidKey: 'BG0DD2EqkenzHDkuO7e_oKGdWR6CMcRD5C4wTmjAK9Yj6Si2vbhLNESb30a7uQZ9dCsDR9hUrpW85E_n_BOlICw'
    });

    if (!token) {
        console.log('No registration token available. Request permission to generate one.');
        return;
    }

    // Register to device group
    const response = await fetch(server + '/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            token: token,
            secret: secrets.secret
        })
    });

    // Set registration to true if successful
    if (response.status === 200) {
        console.log('Successfully registered for push notifications.');
        localStorage.setItem('push', true);
    }
}

async function read_keys() {
    // Read keys from indexedDB
    const tx_keys = store.db.transaction('keys', 'readonly');
    secrets.name = await tx_keys.store.get('name');
    secrets.secret = await tx_keys.store.get('secret');
    secrets.token = await tx_keys.store.get('token');
    secrets.pubkey = await readKey({ armoredKey: await tx_keys.store.get('public') });
    secrets.privkey = await readKey({ armoredKey: await tx_keys.store.get('private') });
}

async function create_keys() {
    // Create peer secret
    const secretKey = await generate_secret();

    // Create peer token
    const token = await generate_secret();

    // Create public and private keys
    const { privateKey, publicKey, revocationCertificate } = await generateKey({
        type: 'ecc',
        curve: 'curve25519',
        userIDs: [{ name: secretKey }],
        format: 'armored'
    })

    // Save keys to database
    const tx = store.db.transaction('keys', 'readwrite');
    await Promise.all([
        tx.store.put(secretKey, 'name'),
        tx.store.put(secretKey, 'secret'),
        tx.store.put(token, 'token'),
        tx.store.put(privateKey, 'private'),
        tx.store.put(publicKey, 'public'),
        tx.done,
    ]);

    localStorage.setItem('init', true);
}

onBeforeMount(async () => {
    // Handle visibility changes
    document.onvisibilitychange = () => {
        if (document.visibilityState === 'hidden') {
            store.focus = false;
            return
        }
        store.focus = true;
    };

    // Configure the virtual keyboard
    if ("virtualKeyboard" in navigator) {
        navigator.virtualKeyboard.overlaysContent = true;
    }

    // Load database
    await load_database();

    // Generate one time secret if empty
    if (!localStorage.getItem('init')) await create_keys();

    // Set values
    await read_keys();

    // Setup peer
    peer_setup();

    // Configure firebase
    firebase_setup();
})
</script>