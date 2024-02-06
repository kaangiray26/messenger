<template>
    <div class="page container d-flex flex-fill h-100">
        <div class="row row-cols-2 g-0 flex-fill shadow">
            <div class="col-12 col-md-3 left-pane">
                <div class="d-flex flex-column h-100">
                    <div class="d-flex flex-wrap align-items-center p-3">
                        <h1 class="material-symbols pe-2 mb-0">voice_selection</h1>
                        <h1 class="fw-bold text-break mb-0">Messenger</h1>
                    </div>
                    <div class="d-flex px-3 mb-3">
                        <span class="fw-bold selectable">{{ name }}</span>
                    </div>
                    <div class="d-flex px-3 mb-3">
                        <div class="dropdown">
                            <span class="material-symbols-outlined dropdown-toggle" role="button" data-bs-toggle="dropdown"
                                aria-expanded="false">
                                more_horiz
                            </span>
                            <ul class="dropdown-menu">
                                <li class="dropdown-li"><a class="dropdown-item" @click="changing = true">Change name</a>
                                </li>
                                <li class="dropdown-li"><a class="dropdown-item" @click="qr_visible = true">Show QR</a></li>
                                <li class="dropdown-li"><a class="dropdown-item" @click="adding = true">Add code</a></li>
                                <li class="dropdown-li"><a class="dropdown-item" @click="qr_scan">Scan QR</a></li>
                                <li class="dropdown-li"><a class="dropdown-item" @click="logging_out = true">Log out</a>
                                </li>
                            </ul>
                        </div>
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
                                    <span v-show="conns[item.secret].unavailable"
                                        class="nord-text-11 fw-bold">Unavailable</span>
                                </div>
                            </div>
                            <div class="d-flex justify-content-end align-items-center">
                                <span v-show="conns[item.secret].notification" class="notification"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="contact" class="right-pane" :class="{ 'd-block col-12': contact }">
                <div class="d-flex flex-column h-100">
                    <div class="contact-header">
                        <span class="material-symbols-outlined clickable me-3" @click="contact = null">
                            arrow_back
                        </span>
                        <img src="/images/person.svg" class="avatar me-2">
                        <span class="name">{{ contact.name }}</span>
                        <div class="dropdown ms-auto">
                            <span class="material-symbols-outlined dropdown-toggle" role="button" data-bs-toggle="dropdown"
                                aria-expanded="false">
                                more_vert
                            </span>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li class="dropdown-li"><a class="dropdown-item" @click="changing = true">Change name</a>
                                </li>
                                <li class="dropdown-li"><a class="dropdown-item" @click="delete_chat">Delete chat</a></li>
                            </ul>
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
</template>

<script setup>
import { ref, onBeforeMount, nextTick } from 'vue';
import { Peer } from 'peerjs';
import { Dropdown } from 'bootstrap';
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import QRCode from 'qrcode'
import Fuse from 'fuse.js'
import jsQR from "jsqr";

const countdown = ref(0);
const secret = ref(null);
const name = ref(null);

// states
const ready = ref(false);
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
const trying = ref({
    id: null
})

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
const app = ref(null);
const messaging = ref(null);
const firebaseConfig = {
    apiKey: "AIzaSyAh17S_KmK43c9U85OudQpti_JQ8hdYJn4",
    authDomain: "kaangiray26-messenger.firebaseapp.com",
    projectId: "kaangiray26-messenger",
    storageBucket: "kaangiray26-messenger.appspot.com",
    messagingSenderId: "908221026498",
    appId: "1:908221026498:web:0afd6e2859e0b20876ab5b"
};
const registrationToken = ref(null);


async function generate_secret() {
    return crypto.getRandomValues(new Uint8Array(16)).reduce((p, i) => p + (i % 16).toString(16), '');
}

async function generate_totp(key) {
    // Get unixtime with minutes precision
    const dt = new Date();
    const seconds = dt.getUTCSeconds() < 30 ? '0' : '1';
    const timestring = `${parseInt(Date.now() / 1000 / 60)}${seconds}`

    // Hash the secret + timestring with SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode(key + timestring);
    const hash = await crypto.subtle.digest('SHA-256', data);

    // Convert the hash to string
    const hashArray = Array.from(new Uint8Array(hash));
    const code = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Display the code
    return code;
}

async function copy_qrcode() {
    await navigator.clipboard.writeText(qrcode_data.value);
}

async function get_countdown() {
    countdown.value = 30 - (new Date().getUTCSeconds() % 30);
    if (countdown.value === 30) {
        peer_setup();
    }
}

async function handle_keys(event) {
    if (desktop.value && !event.shiftKey && event.key === 'Enter') {
        textarea.value.focus();
        event.preventDefault();

        // Return if message is empty
        if (!message.value.length) return;

        // Send message
        send_message({
            type: 'message',
            message: message.value
        });
    }
}

async function handle_send() {
    textarea.value.focus();

    // Return if message is empty
    if (!message.value.length) return;

    // Send message
    send_message({
        type: 'message',
        message: message.value
    });
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
        localStorage.setItem('name', name.value);
        changing.value = false;
        return
    }

    // Find the right contact in the array and change it
    const index = contacts.value.findIndex(item => item.secret == contact.value.secret);
    contacts.value[index].name = name_input.value.value;
    save_contacts();

    // Close the modal
    changing.value = false;
}

async function delete_chat() {
    // Remove contact from array
    const index = contacts.value.findIndex(item => item.secret == contact.value.secret);
    contacts.value.splice(index, 1);
    save_contacts();

    // Remove connection from array
    delete conns.value[contact.value.secret];

    // Close the chat
    contact.value = null;
}

async function open_keyboard() {
    console.log("Opening keyboard...");
    if ("virtualKeyboard" in navigator) navigator.virtualKeyboard.show();
}

async function logout() {
    // Clear localStorage
    localStorage.clear();

    // Reload page
    window.location.href = window.location.origin + window.location.pathname;
}

async function send_message(data) {
    // Check if connection exists
    if (conns.value[contact.value.secret].conn) {
        const connection = conns.value[contact.value.secret];
        connection.conn.send(data);
        connection.items.push({
            type: 'message',
            data: data.message,
            me: true,
            dt: new Date().toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric' })
        });
        message.value = '';
        nextTick(() => {
            messages.value.scroll({
                top: messages.value.scrollHeight,
                behavior: 'smooth'
            })
        })
        return
    }

    // Create connection and send the message
    const totp = await generate_totp(contact.value.secret);
    const connection = peer.value.connect(totp, {
        reliable: true,
        metadata: {
            from: secret.value,
            to: contact.value.secret,
        }
    })
    connection.on('open', () => {
        handle_outgoing_connection(connection);
        connection.send(data);
        conns.value[contact.value.secret].items.push({
            type: 'message',
            data: data.message,
            me: true,
            dt: new Date().toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric' })
        });
        message.value = '';
    })
}

async function add_contact(item) {
    // Check if contact already exists
    const found = contacts.value.filter(ct => ct.secret == item).length;
    if (found) return;

    const totp = await generate_totp(item);
    const connection = peer.value.connect(totp, {
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
            secret: secret.value
        })
    })

    connection.on('data', (data) => {
        if (data.type == "handshake") {
            conns.value[data.secret] = {
                conn: null,
                items: [],
                unavailable: false,
                notification: false,
            }
            contacts.value.push({
                name: data.name,
                secret: data.secret
            });
            save_contacts();

            // Close connection
            connection.close();
        }
    })
}

async function refresh() {
    window.location.href = window.location.origin + window.location.pathname;
}

async function open_chat(item) {
    // Check if connection exists
    if (conns.value.hasOwnProperty(item.secret) && conns.value[item.secret].conn) {
        conns.value[item.secret].notification = false;
        contact.value = item;
        return
    }

    // Create connection
    const totp = await generate_totp(item.secret);
    trying.value.id = item.secret;
    const connection = peer.value.connect(totp, {
        reliable: true,
        metadata: {
            from: secret.value,
            to: item.secret,
        }
    })
    connection.on('open', () => {
        handle_outgoing_connection(connection);
        conns.value[item.secret].unable = false;
        contact.value = item;
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

async function handle_incoming_connection(connection) {
    // Data handler
    connection.on('data', (data) => {
        console.log('Incoming data:', data);
        // Handle handshake
        if (data.type == 'handshake') {
            const found = contacts.value.filter(ct => ct.secret == data.secret).length;
            if (found) return;

            qr_visible.value = false;
            conns.value[data.secret] = {
                conn: null,
                items: [],
                unavailable: false,
                notification: false,
            }
            contacts.value.push({
                name: data.name,
                secret: data.secret
            });
            save_contacts();
            connection.send({
                type: 'handshake',
                name: name.value,
                secret: secret.value
            })
            return
        }

        // Handle message
        if (data.type === 'message') {
            // Set notification
            if (!contact.value || contact.value.secret != connection.metadata.from) {
                conns.value[connection.metadata.from].notification = true;
                create_notification(connection.metadata.from, data.message);
            }
            conns.value[connection.metadata.from].items.push({
                type: 'message',
                data: data.message,
                me: false,
                dt: new Date().toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric' })
            });
            return
        }
    });

    // Close handler
    connection.on('close', () => {
        console.log('Connection closed:', connection.metadata.from);
        conns.value[connection.metadata.from].conn = null;
    })

    // Add connection to list
    conns.value[connection.metadata.from] = {
        conn: connection,
        items: [],
        unavailable: false,
        notification: false,
    }
}

async function handle_outgoing_connection(connection) {
    // Add message to list
    connection.on('data', (data) => {
        console.log('Outgoing data:', data);
        // Handle shakehand
        if (data.type === 'shakehand') {
            if (contacts.value.includes(data.secret)) return;
            conns.value[data.secret] = {
                conn: null,
                items: [],
                unavailable: false,
                notification: false,
            }
            contacts.value.push({
                name: data.name,
                secret: data.secret
            });
            save_contacts();
            return
        }

        // Handle message
        if (data.type === 'message') {
            if (!contact.value || contact.value.secret != connection.metadata.to) {
                conns.value[connection.metadata.to].notification = true;
                create_notification(connection.metadata.to, data.message);
            }
            conns.value[connection.metadata.to].items.push({
                type: 'message',
                data: data.message,
                me: false,
                dt: new Date().toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric' })
            });
        }
    });

    // Close handler
    connection.on('close', () => {
        console.log('Connection closed:', connection.metadata.to);
        conns.value[connection.metadata.to].conn = null;
    })

    // Add connection to list
    conns.value[connection.metadata.to] = {
        conn: connection,
        items: [],
        unavailable: false,
        notification: false,
    }
}

async function peer_first_setup() {
    // Create peer
    const totp = await generate_totp(secret.value);
    peer.value = new Peer([totp], {
        config: {
            iceServers: [
                {
                    urls: "turn:standard.relay.metered.ca:80",
                    username: "90e794d7186335533be6a215",
                    credential: "05ker3YuARTJkdfP",
                },
            ]
        }
    });
    peer.value.on('connection', (connection) => {
        handle_incoming_connection(connection);
    })
    peer.value.on('open', () => {
        ready.value = true;
    });
    peer.value.on('error', (error) => {
        if (error.type == 'peer-unavailable' && trying.value.id) {
            console.log('Peer unavailable:', trying.value.id);
            conns.value[trying.value.id].unavailable = true;
        }
    })
}

async function peer_setup() {
    // Create peer
    const totp = await generate_totp(secret.value);
    peer.value = new Peer([totp], {
        config: {
            iceServers: [
                {
                    urls: "turn:standard.relay.metered.ca:80",
                    username: "90e794d7186335533be6a215",
                    credential: "05ker3YuARTJkdfP",
                },
            ]
        }
    });
    peer.value.on('connection', (connection) => {
        handle_incoming_connection(connection);
    })
    peer.value.on('open', () => {
        console.log('New Peer created:', peer.value.id);
    })
    peer.value.on('error', (error) => {
        if (error.type == 'peer-unavailable' && trying.value.id) {
            console.log('Peer unavailable:', trying.value.id);
            conns.value[trying.value.id].unavailable = true;
        }
    })
}

async function save_contacts() {
    localStorage.setItem('contacts', JSON.stringify(contacts.value));
    results.value = contacts.value;
    fuse.value.setCollection(contacts.value);
}

async function load_contacts() {
    const data = localStorage.getItem('contacts');
    if (data) {
        contacts.value = JSON.parse(data);
        results.value = contacts.value;
    }
    contacts.value.map(item => {
        conns.value[item.secret] = {
            conn: null,
            items: [],
            unavailable: false,
            notification: false,
        }
    })
}

async function create_notification(secret, body) {
    const name = contacts.value.find(item => item.secret == secret).name;
    Notification.requestPermission().then((result) => {
        if (result === "granted") {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(name, {
                    body: body,
                    icon: "/messenger/images/512x512.png",
                    vibrate: [200, 100, 200, 100, 200, 100, 200],
                    tag: "vibration-sample",
                });
            });
        }
    });
}

async function firebase_setup() {
    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
    });

    getToken(messaging, {
        vapidKey: 'BG0DD2EqkenzHDkuO7e_oKGdWR6CMcRD5C4wTmjAK9Yj6Si2vbhLNESb30a7uQZ9dCsDR9hUrpW85E_n_BOlICw'
    }).then((currentToken) => {
        if (currentToken) {
            console.log('Token:', currentToken);
            registrationToken.value = currentToken;
        } else {
            console.log('No registration token available. Request permission to generate one.');
        }
    }).catch((err) => {
        console.log('An error occurred while retrieving token. ', err);
    });
}

onBeforeMount(async () => {
    // Generate one time secret if empty
    if (localStorage.getItem('secret') === null) {
        localStorage.setItem('secret', await generate_secret());
    }
    secret.value = localStorage.getItem('secret');
    name.value = localStorage.getItem('name') || secret.value;
    console.log('Secret:', secret.value);

    // Configure the virtual keyboard
    if ("virtualKeyboard" in navigator) {
        navigator.virtualKeyboard.overlaysContent = true;
    }

    // Configure firebase
    firebase_setup();

    // Setup peer and check for url parameters
    peer_first_setup();

    // Load contacts
    load_contacts();

    // Set device mode
    if (window.innerWidth > 768) {
        desktop.value = true;
    }

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

    // Create fuzzy search
    fuse.value = new Fuse(contacts.value, {
        keys: ['name', 'secret'],
        threshold: 0.3,
    })

    // Generate TOTP
    get_countdown();

    // Loop every second
    setInterval(() => {
        get_countdown();
    }, 1000);
})
</script>