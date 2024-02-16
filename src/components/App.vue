<template>
    <div class="page container d-flex flex-fill h-100">
        <div class="row row-cols-2 g-0 flex-fill shadow">
            <!-- Left Pane -->
            <div class="col-12 col-md-3 left-pane">
                <div class="d-flex flex-column h-100">
                    <div class="d-flex flex-wrap align-items-end p-3">
                        <h1 class="material-symbols pe-2 mb-0">voice_selection</h1>
                        <h1 class="fw-bold text-break mb-0">Messenger</h1>
                        <div class="dropdown ms-auto">
                            <span class="material-symbols-outlined dropdown-toggle" role="button" data-bs-toggle="dropdown"
                                aria-expanded="false" @click="requestPermission">
                                more_vert
                            </span>
                            <ul class="dropdown-menu">
                                <li class="dropdown-li">
                                    <a class="dropdown-item" @click="changing = true">
                                        <span class="bi bi-pencil-fill pe-1"></span>
                                        Change name
                                    </a>
                                </li>
                                <li class="dropdown-li">
                                    <a class="dropdown-item" @click="qr_visible = true">
                                        <span class="bi bi-qr-code pe-1"></span>
                                        Show QR
                                    </a>
                                </li>
                                <li class="dropdown-li">
                                    <a class="dropdown-item" @click="qr_scan">
                                        <span class="bi bi-qr-code-scan pe-1"></span>
                                        Scan QR
                                    </a>
                                </li>
                                <li class="dropdown-li">
                                    <a class="dropdown-item" @click="adding = true">
                                        <span class="bi bi-key-fill pe-1"></span>
                                        Add code
                                    </a>
                                </li>
                                <li class="dropdown-li">
                                    <a class="dropdown-item" @click="logging_out = true">
                                        <span class="bi bi-door-open-fill pe-1"></span>
                                        Log out
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div class="d-flex px-3 mb-3">
                        <span class="fw-bold selectable">{{ name }}</span>
                    </div>
                    <div class="input-group px-3 mb-2">
                        <span class="input-group-text bi bi-search" id="username-search"></span>
                        <input v-model="query" type="text" class="form-control" placeholder="Search..."
                            aria-label="Username" aria-describedby="username-search" @input="get_results">
                    </div>
                    <div class="contacts">
                        <div v-for="item in results" class="contact" @click="open_chat(item)">
                            <div class="d-flex align-items-center">
                                <img src="/images/person.svg" class="avatar me-2">
                                <div class="d-flex flex-column">
                                    <span class="name">{{ item.name }}</span>
                                </div>
                            </div>
                            <div class="d-flex justify-content-end align-items-center">
                                <span v-show="conns[item.secret].notification" class="notification"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Right Pane -->
            <div v-if="contact" class="right-pane" :class="{ 'd-block col-12': contact }">
                <div class="d-flex flex-column h-100">
                    <div class="contact-header">
                        <span class="material-symbols-outlined clickable me-3" @click="contact = null">
                            arrow_back
                        </span>
                        <img src="/images/person.svg" class="avatar me-2">
                        <span class="name">{{ contact.name }}</span>
                        <div class="d-flex align-items-center ms-auto">
                            <div class="icon-btn me-2" @click="videocall_contact">
                                <span class="material-symbols-outlined">video_call</span>
                            </div>
                            <div class="icon-btn me-2" @click="voicecall_contact">
                                <span class="material-symbols-outlined">call</span>
                            </div>
                            <div class="dropdown">
                                <span class="material-symbols-outlined dropdown-toggle" role="button"
                                    data-bs-toggle="dropdown" aria-expanded="false">
                                    more_vert
                                </span>
                                <ul class="dropdown-menu dropdown-menu-end">
                                    <li class="dropdown-li">
                                        <a class="dropdown-item" @click="changing = true">
                                            <span class="bi bi-pencil-fill pe-1"></span>
                                            Change name
                                        </a>
                                    </li>
                                    <li class="dropdown-li">
                                        <a class="dropdown-item" @click="clear_chat">
                                            <span class="bi bi-eraser-fill pe-1"></span>
                                            Clear chat
                                        </a>
                                    </li>
                                    <li class="dropdown-li">
                                        <a class="dropdown-item" @click="remove_contact">
                                            <span class="bi bi-trash-fill pe-1"></span>
                                            Remove contact
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div ref="messages" class="messages">
                        <div v-for="(item, index) in conns[contact.secret].items" class="message shadow"
                            :class="{ 'me': item.me }">
                            <span class="selectable">{{ item.data }}</span>
                            <span class="time">{{ item.dt }}</span>
                        </div>
                    </div>
                    <div class="textarea-container">
                        <textarea ref="textarea" v-model="message" class="form-control" placeholder="Message" rows="1"
                            @keypress="handle_keys" @input="handle_input" @focus="open_keyboard"></textarea>
                        <div class="send-button" @click="handle_send">
                            <span class="material-symbols-outlined">
                                send
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- Overlays -->
    <div v-if="qr_visible" id="qr">
        <div class="qr-container d-flex flex-column bg-white shadow p-3">
            <div class="d-flex justify-content-end mb-3">
                <button class="btn btn-close" @click="qr_visible = false"></button>
            </div>
            <p class="mb-0">Scan this QR code to connect or click on it to copy.</p>
            <img :src="qrcode" class="qr-code" @click="copy_qrcode">
        </div>
    </div>
    <div v-if="!ready" class="overlay-blur">
        <div class="d-flex flex-column align-items-center">
            <img src="/images/star.svg" class="loading-icon">
            <span class="my-3">Loading...</span>
            <span class="btn btn-dark" @click="refresh">Refresh</span>
        </div>
    </div>
    <div v-if="changing" class="overlay">
        <div class="d-flex flex-column bg-light rounded shadow p-3">
            <span class="fw-bold mb-3">Enter a new name</span>
            <div class="input-group mb-3">
                <span class="input-group-text" id="basic-addon1">@</span>
                <input ref="name_input" type="text" class="form-control" placeholder="Username" aria-label="Username"
                    aria-describedby="basic-addon1" @keypress.enter="change_name" autofocus>
            </div>
            <div class="d-flex justify-content-end">
                <button class="btn btn-primary me-2" @click="change_name">Save</button>
                <button class="btn btn-secondary" @click="changing = false">Cancel</button>
            </div>
        </div>
    </div>
    <div v-if="logging_out" class="overlay">
        <div class="d-flex flex-column bg-light rounded shadow p-3">
            <span class="fw-bold mb-3">Are you sure you want to log out?</span>
            <div class="d-flex justify-content-end">
                <button class="btn btn-primary me-2" @click="logout">Yes</button>
                <button class="btn btn-secondary" @click="logging_out = false">No</button>
            </div>
        </div>
    </div>
    <div v-if="scanning" class="overlay-dark p-3">
        <div class="d-flex flex-column rounded">
            <canvas ref="canvas"></canvas>
            <span class="text-center text-light mt-3">Scan a Messenger QR code</span>
            <button class="btn btn-outline-light mt-1 mx-auto" @click="stop_qr_scan">Cancel</button>
        </div>
    </div>
    <div v-if="adding" class="overlay">
        <div class="d-flex flex-column bg-light rounded shadow p-3">
            <span class="fw-bold mb-3">Enter code</span>
            <div class="input-group mb-3">
                <span class="input-group-text bi bi-qr-code" id="basic-code"></span>
                <input ref="code_input" type="text" class="form-control" placeholder="Code" aria-label="Code"
                    aria-describedby="basic-code" @keypress.enter="change_name" autofocus>
            </div>
            <div class="d-flex justify-content-end">
                <button class="btn btn-primary me-2" @click="add_code">Add</button>
                <button class="btn btn-secondary" @click="adding = false">Cancel</button>
            </div>
        </div>
    </div>
    <VoiceCall ref="voicecall" :peer="peer"></VoiceCall>
    <VideoCall ref="videocall" :peer="peer"></VideoCall>
</template>

<script setup>
import { ref, onBeforeMount, nextTick } from 'vue';
import VoiceCall from './VoiceCall.vue';
import VideoCall from './VideoCall.vue';
import { Peer } from 'peerjs';
import { Dropdown } from 'bootstrap';
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { generateKey, readKey, encrypt, decrypt, createMessage, readMessage } from 'openpgp';
import { openDB, deleteDB } from 'idb';
import QRCode from 'qrcode'
import Fuse from 'fuse.js'
import jsQR from "jsqr";

// Secrets
const name = ref(null);
const token = ref(null);
const secret = ref(null);
const pubkey = ref(null);
const privkey = ref(null);

// states
const ready = ref(true);
const desktop = ref(false);
const adding = ref(false);
const changing = ref(false);
const logging_out = ref(false);
const scanning = ref(false);

// input
const query = ref('');
const name_input = ref(null);
const code_input = ref(null);

// textarea
const message = ref('');
const textarea = ref(null);

// PeerJS
const peer = ref(null);
const conns = ref({});
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

// contacts
const contact = ref(null);
const contacts = ref([]);
const results = ref([]);

// messages
const messages = ref(null);

// qrcode
const video = ref(null);
const canvas = ref(null);
const context = ref(null);
const qrcode = ref(null);
const qrcode_data = ref(null);
const qr_visible = ref(false);

// fuzzy search
const fuse = ref(null);

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

// database
const db = ref(null);

// Calls
const videocall = ref(null);
const voicecall = ref(null);

async function generate_secret() {
    return crypto.getRandomValues(new Uint8Array(16)).reduce((p, i) => p + (i % 16).toString(16), '');
}

async function copy_qrcode() {
    await navigator.clipboard.writeText(qrcode_data.value);
}

async function handle_keys(event) {
    if (desktop.value && !event.shiftKey && event.key === 'Enter') {
        textarea.value.focus();
        event.preventDefault();

        // Return if message is empty
        if (!message.value.length) return;

        // Send message
        send_message({
            'message': message.value,
            'contact': contact.value
        });

        // Clear message
        message.value = '';
    }
}

async function handle_send() {
    textarea.value.focus();

    // Return if message is empty
    if (!message.value.length) return;

    // Send message
    send_message({
        'message': message.value,
        'contact': contact.value
    });

    // Clear message
    message.value = '';
}

async function handle_input() {
    // Check how many lines the textarea has
    let lines = textarea.value.value.split('\n').length;

    if (lines > 5) {
        lines = 5;
    }

    textarea.value.rows = lines;
}

async function get_results() {
    if (!query.value.length) {
        results.value = contacts.value;
        return;
    }
    results.value = fuse.value.search(query.value).map(item => item.item);
}

async function requestPermission() {
    if (Notification.permission === 'granted') return;
    Notification.requestPermission().then((result) => {
        window.location.href = window.location.origin + window.location.pathname;
    });
}

async function add_code() {
    if (!code_input.value.value.length) return;
    add_contact(code_input.value.value);
    adding.value = false;
}

async function change_name() {
    if (!name_input.value.value.length) return;

    // If no contact is set change own name
    if (!contact.value) {
        name.value = name_input.value.value;
        await db.value.put('keys', name.value, 'name');
        changing.value = false;
        return
    }

    // Find the right contact in the array and change it
    const index = contacts.value.findIndex(item => item.secret == contact.value.secret);
    contacts.value[index].name = name_input.value.value;

    // Update the database
    const tx = db.value.transaction('contacts', 'readwrite');
    await tx.store.put({
        name: name_input.value.value,
        secret: contact.value.secret,
        pubkey: contact.value.pubkey
    });

    // Close the modal
    changing.value = false;
}

async function clear_chat() {
    const secret = contact.value.secret;

    // Clear the chat
    conns.value[secret].items = [];

    // Clear messages that has the same secret in the index
    const tx = db.value.transaction('messages', 'readwrite');
    const index = tx.store.index('secret');
    const keys = await index.getAllKeys(secret);

    for (const key of keys) {
        await tx.store.delete(key);
    }

    console.info('Chat cleared!');
}

async function remove_contact() {
    // Remove contact from array
    const index = contacts.value.findIndex(item => item.secret == contact.value.secret);
    contacts.value.splice(index, 1);

    // Update the database
    const tx = db.value.transaction('contacts', 'readwrite');
    await tx.store.delete(contact.value.secret);

    // Remove connection from array
    delete conns.value[contact.value.secret];

    // Close the chat
    contact.value = null;
}

async function open_keyboard() {
    if ("virtualKeyboard" in navigator) {
        navigator.virtualKeyboard.show();
        nextTick(() => {
            messages.value.scroll({
                top: messages.value.scrollHeight,
                behavior: 'smooth'
            })
        })
    }
}

async function logout() {
    console.log('Logging out...');
    // Clear localStorage
    localStorage.clear();

    // Clear indexedDB
    await db.value.close();
    await deleteDB('messenger');

    // Reload page
    window.location.href = window.location.origin + window.location.pathname;
}

async function videocall_contact() {
    // Get name
    const contact_secret = contact.value.secret;
    const contact_name = contacts.value.find(item => item.secret == contact_secret).name;

    videocall.value.make_call(contact_secret, contact_name);
}

async function voicecall_contact() {
    // Get name
    const contact_secret = contact.value.secret;
    const contact_name = contacts.value.find(item => item.secret == contact_secret).name;

    voicecall.value.make_call(contact_secret, contact_name);
}

async function send_message(data) {
    console.log("Message to send:", data);

    // Encrypt message
    const encrypted = await encrypt({
        message: await createMessage({ text: data.message }),
        encryptionKeys: await readKey({ armoredKey: data.contact.pubkey }),
    });

    // Message object
    const time = new Date();
    const msg = {
        secret: data.contact.secret,
        data: data.message,
        me: true,
        dt: time.toLocaleTimeString('en-GB', {
            hour: 'numeric', minute: 'numeric'
        }),
        timestamp: +time
    }

    // Add to database
    const tx = db.value.transaction('messages', 'readwrite');
    await tx.store.put(msg);

    // Add to chat
    conns.value[data.contact.secret].items.push(msg);

    nextTick(() => {
        messages.value.scroll({
            top: messages.value.scrollHeight,
            behavior: 'smooth'
        })
    })

    // 1: Use the already present connection and send the message
    if (conns.value[data.contact.secret].conn) {
        const connection = conns.value[data.contact.secret];
        connection.metadata = {
            from: secret.value,
            to: data.contact.secret,
            body: encrypted,
        }
        connection.conn.send({
            type: 'message',
            message: encrypted
        });
        return
    }

    // 2: Try to create a new connection and send the message
    const connection = peer.value.connect(data.contact.secret, {
        reliable: true,
        metadata: {
            from: secret.value,
            to: data.contact.secret,
            body: encrypted,
        }
    })
    connection.on('open', async () => {
        handle_outgoing_connection(connection);
        connection.send({
            type: 'message',
            message: encrypted
        });
        return
    })
}

async function add_contact(item) {
    // Check if contact already exists
    // Check for contact in database
    const found = await db.value.getFromIndex('contacts', 'secret', item);
    if (found) return;

    const connection = peer.value.connect(item, {
        reliable: true,
        metadata: {
            from: secret.value,
            to: item
        }
    })

    connection.on('open', () => {
        connection.send({
            type: "handshake",
            name: name.value,
            secret: secret.value,
            pubkey: pubkey.value.armor()
        })
    })

    connection.on('data', async (data) => {
        if (data.type == "handshake") {
            conns.value[data.secret] = {
                conn: null,
                items: [],
                notification: false,
                pubkey: data.pubkey
            }
            contacts.value.push({
                name: data.name,
                secret: data.secret,
                pubkey: data.pubkey
            });
            // Add to indexeddb contacts
            const tx = db.value.transaction('contacts', 'readwrite');
            await tx.store.put({
                name: data.name,
                secret: data.secret,
                pubkey: data.pubkey
            });
            // Set up results
            results.value = contacts.value;
            fuse.value.setCollection(contacts.value);
            // Close connection
            connection.close();
        }
    })
}

async function refresh() {
    window.location.href = window.location.origin + window.location.pathname;
}

async function open_chat(item) {
    // Load contact
    conns.value[item.secret].notification = false;
    contact.value = item;

    // Load messages
    const tx = db.value.transaction('messages', 'readonly');
    const msgs = await tx.store.index('secret').getAll(item.secret);
    conns.value[item.secret].items = msgs;

    nextTick(() => {
        if (desktop.value) textarea.value.focus();
        messages.value.scroll({
            top: messages.value.scrollHeight,
            behavior: 'auto'
        })
    })
}

async function stop_qr_scan() {
    scanning.value = false;
    video.value.srcObject.getTracks().forEach(track => track.stop());
    video.value.remove();
    canvas.value.remove();
    context.value = null;
    video.value = null;
    canvas.value = null;
}

async function qr_scan() {
    scanning.value = true;
    await nextTick();

    video.value = document.createElement("video");
    context.value = canvas.value.getContext("2d");

    navigator.mediaDevices
        .getUserMedia({
            video: {
                facingMode: "environment"
            }, audio: false
        })
        .then((stream) => {
            video.value.srcObject = stream;
            video.value.setAttribute("playsinline", true);
            video.value.play();
            requestAnimationFrame(tick);
        })
        .catch((err) => {
            console.error(`An error occurred: ${err}`);
        });
}

function drawLine(begin, end, color) {
    context.value.beginPath();
    context.value.moveTo(begin.x, begin.y);
    context.value.lineTo(end.x, end.y);
    context.value.lineWidth = 4;
    context.value.strokeStyle = color;
    context.value.stroke();
}

function tick() {
    if (!scanning.value) return;
    if (video.value.readyState === video.value.HAVE_ENOUGH_DATA) {
        canvas.value.height = video.value.videoHeight;
        canvas.value.width = video.value.videoWidth;
        context.value.drawImage(video.value, 0, 0, canvas.value.width, canvas.value.height);

        let imageData = context.value.getImageData(0, 0, canvas.value.width, canvas.value.height);
        let code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        });

        if (code) {
            drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
            drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
            drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
            drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");

            add_contact(code.data);
            stop_qr_scan();
        }
    }
    requestAnimationFrame(tick);
}

async function handle_incoming_call(call) {
    console.log("Call:", call);
    // Get metadata
    const metadata = call.metadata;

    const caller_id = call.metadata.secret;
    const caller_name = contacts.value.find(item => item.secret == caller_id).name;

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
            const found = contacts.value.filter(ct => ct.secret == data.secret).length;
            if (found) return;

            qr_visible.value = false;
            conns.value[data.secret] = {
                conn: null,
                items: [],
                notification: false,
                pubkey: data.pubkey
            }
            contacts.value.push({
                name: data.name,
                secret: data.secret,
                pubkey: data.pubkey
            });
            // Add to indexeddb contacts
            const tx = db.value.transaction('contacts', 'readwrite');
            await tx.store.put({
                name: data.name,
                secret: data.secret,
                pubkey: data.pubkey
            });
            // Set up results
            results.value = contacts.value;
            fuse.value.setCollection(contacts.value);
            connection.send({
                type: 'handshake',
                name: name.value,
                secret: secret.value,
                pubkey: pubkey.value.armor()
            })
            return
        }

        // Handle message
        if (data.type === 'message') {
            // Decrypt message
            const decrypted = await decrypt({
                message: await readMessage({ armoredMessage: data.message }),
                decryptionKeys: privkey.value
            });

            // Set notification
            const isOpen = contact.value && contact.value.secret == connection.metadata.from;

            if (!isOpen) {
                conns.value[connection.metadata.from].notification = true;
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
            const tx = db.value.transaction('messages', 'readwrite');
            await tx.store.put(msg);

            // Add to chat
            conns.value[connection.metadata.from].items.push(msg);

            // Scroll down
            if (isOpen) {
                nextTick(() => {
                    messages.value.scroll({
                        top: messages.value.scrollHeight,
                        behavior: 'smooth'
                    })
                })
            }
        }
    });

    // Error handler
    connection.on('error', (err) => {
        console.log('Connection incoming error:', err.type, connection.metadata);
    })

    // Close handler
    connection.on('close', () => {
        console.log('Connection incoming closed:', connection.metadata.from);
        conns.value[connection.metadata.from].conn = null;
    })

    // Add connection to list
    if (conns.value[connection.metadata.from]) {
        conns.value[connection.metadata.from].conn = connection;
        return
    }
    conns.value[connection.metadata.from] = {
        conn: connection,
        items: [],
        notification: false,
        pubkey: null
    }
}

async function handle_outgoing_connection(connection) {
    // Add message to list
    connection.on('data', async (data) => {
        console.log('Outgoing data:', data);
        // Handle message
        if (data.type === 'message') {
            // Decrypt message
            const decrypted = await decrypt({
                message: await readMessage({ armoredMessage: data.message }),
                decryptionKeys: privkey.value
            });

            // Set notification
            const isOpen = contact.value && contact.value.secret == connection.metadata.to;

            if (!isOpen) {
                conns.value[connection.metadata.to].notification = true;
                create_notification(connection.metadata.to, decrypted.data);
            }

            // Message object
            const time = new Date();
            const msg = {
                secret: connection.metadata.to,
                data: decrypted.data,
                me: false,
                dt: time.toLocaleTimeString('en-GB', {
                    hour: 'numeric', minute: 'numeric'
                }),
                timestamp: +time
            }

            // Add to database
            const tx = db.value.transaction('messages', 'readwrite');
            await tx.store.put(msg);

            // Add to chat
            conns.value[connection.metadata.to].items.push(msg);

            // Scroll down
            if (isOpen) {
                nextTick(() => {
                    messages.value.scroll({
                        top: messages.value.scrollHeight,
                        behavior: 'smooth'
                    })
                })
            }
        }
    });

    // Error handler
    connection.on('error', (err) => {
        console.log('Connection outgoing error:', err.type, connection.metadata);
    })

    // Close handler
    connection.on('close', () => {
        console.log('Connection closed:', connection.metadata.to);
        conns.value[connection.metadata.to].conn = null;
    })

    // Add connection to list
    if (conns.value[connection.metadata.to]) {
        conns.value[connection.metadata.to].conn = connection;
        return
    }
    conns.value[connection.metadata.to] = {
        conn: connection,
        items: [],
        notification: false,
        pubkey: null
    }
}

async function peer_setup() {
    console.log('Setting up peer...');
    WebSocket
    // Create peer
    peer.value = new Peer([secret.value], {
        host: 'home.buzl.uk',
        port: 443,
        path: '/',
        token: token.value,
        config: peerConfig,
        secure: true,
    });
    peer.value.on('connection', (connection) => {
        console.log('New incoming connection created:', connection.metadata.from);
        handle_incoming_connection(connection);
    })
    peer.value.on('open', () => {
        console.log('New Peer created:', peer.value.id);
    })
    peer.value.on('close', () => {
        console.log("Peer close event!");
    })
    peer.value.on('call', (call) => {
        console.log("New incoming call");
        handle_incoming_call(call);
    })
}

async function load_database() {
    // IndexedDB
    db.value = await openDB('messenger', 1, {
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
    const tx_contacts = db.value.transaction('contacts', 'readonly');
    const data = await tx_contacts.store.getAll();
    if (data) {
        contacts.value = data;
        results.value = contacts.value;
    }
    contacts.value.map(item => {
        conns.value[item.secret] = {
            conn: null,
            items: [],
            notification: false,
            pubkey: null
        }
    })
}

async function create_notification(secret, body) {
    const name = contacts.value.find(item => item.secret == secret).name;
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
        decryptionKeys: privkey.value
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
    const tx = db.value.transaction('messages', 'readwrite');
    await tx.store.put(msg);

    // Set notification
    create_notification(title, decrypted.data);
}

async function firebase_setup() {
    // console.log("Firebase setup...");
    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    onMessage(messaging, handle_message);

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
            secret: secret.value
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
    const tx_keys = db.value.transaction('keys', 'readonly');
    name.value = await tx_keys.store.get('name');
    secret.value = await tx_keys.store.get('secret');
    token.value = await tx_keys.store.get('token');
    pubkey.value = await readKey({ armoredKey: await tx_keys.store.get('public') });
    privkey.value = await readKey({ armoredKey: await tx_keys.store.get('private') });
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
    const tx = db.value.transaction('keys', 'readwrite');
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
    // Set device mode
    if (window.innerWidth > 768) {
        desktop.value = true;
    }

    // Handle visibility changes
    document.onvisibilitychange = () => {
        if (document.visibilityState === 'hidden') {
            // console.log('App is now hidden');
            contact.value = null;
        }
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

    // Create fuzzy search
    fuse.value = new Fuse(contacts.value, {
        keys: ['name', 'secret'],
        threshold: 0.3,
    })

    // Create qr code
    qrcode_data.value = secret.value;
    QRCode.toDataURL(qrcode_data.value, {
        errorCorrectionLevel: 'H',
        type: 'image/jpeg',
        quality: 1,
        margin: 1,
        width: 256,
        color: {
            dark: '#000000',
            light: '#ffffff'
        }
    }).then(url => {
        qrcode.value = url;
    })
})
</script>