<template>
    <div class="container d-flex flex-fill h-100 py-3">
        <div class="row row-cols-2 g-0 flex-fill shadow">
            <div class="col-12 col-md-3 left-pane">
                <div class="d-flex flex-column h-100">
                    <div class="d-flex flex-wrap align-items-center p-3">
                        <h1 class="material-symbols pe-2 mb-0">voice_selection</h1>
                        <h1 class="fw-bold text-break mb-0">Messenger</h1>
                    </div>
                    <div class="d-flex px-3 mb-3">
                        <div class="dropdown">
                            <button class="btn material-symbols dropdown-toggle" type="button" data-bs-toggle="dropdown"
                                aria-expanded="false">
                                more_horiz
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" @click="qr_visible = true">Show QR</a></li>
                                <li><a class="dropdown-item" @click="scan_qr">Scan QR</a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="input-group px-2 mb-2">
                        <span class="input-group-text bi bi-search" id="username-search"></span>
                        <input type="text" class="form-control" placeholder="Username" aria-label="Username"
                            aria-describedby="username-search">
                    </div>
                    <div class="contacts">
                        <div v-for="item in contacts" class="contact" @click="open_chat(item)">
                            <div class="d-flex align-items-center">
                                <img src="/images/person.svg" class="avatar">
                                <span class="name">{{ item }}</span>
                            </div>
                            <div class="d-flex justify-content-end align-items-center">
                                <span v-show="conns[item].notification" class="notification"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="contact" class="right-pane" :class="{ 'd-block col-12': contact }">
                <div class="d-flex flex-column h-100">
                    <div class="contact-header">
                        <div class="d-flex align-items-center">
                            <img src="/images/person.svg" class="avatar">
                            <span class="name">{{ contact }}</span>
                        </div>
                        <button class="btn btn-close" @click="contact = null"></button>
                    </div>
                    <div class="messages">
                        <div v-for="(item, index) in conns[contact].items" class="message shadow"
                            :class="{ 'me': item.me }">
                            <span>{{ item.data }}</span>
                            <span class="time">{{ item.dt }}</span>
                        </div>
                    </div>
                    <div class="textarea-container">
                        <textarea ref="textarea" v-model="message" class="form-control" placeholder="Type a message"
                            rows="2" @keypress="handle_keys"></textarea>
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
            <p class="mb-0">Scan this QR code with your phone to connect</p>
            <img :src="qrcode" class="qr-code">
        </div>
    </div>
</template>

<script setup>
import { ref, onBeforeMount, nextTick } from 'vue';
import { Peer } from 'peerjs';
import { Dropdown } from 'bootstrap';
import QRCode from 'qrcode'

const countdown = ref(0);
const secret = ref(null);

// textarea
const message = ref('');
const textarea = ref(null);

// PeerJS
const peer = ref(null);
const conns = ref({});

// contacts
const contact = ref(null);
const contacts = ['eb864056d578fbca', '7ae9f7275a5adaba'];

// qrcode
const qrcode = ref(null);
const qr_visible = ref(false);

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

async function get_countdown() {
    countdown.value = 30 - (new Date().getUTCSeconds() % 30);
    if (countdown.value === 30) {
        peer_setup();
    }
}

async function handle_keys(event) {
    if (!event.shiftKey && event.key === 'Enter') {
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

async function show_qr() {
    QRCode.toDataURL(secret.value).then(url => {
        qrcode.value = url;
    })
}

async function send_message(data) {
    // Check if connection exists
    if (conns.value.hasOwnProperty(contact.value)) {
        console.log('Sending message:', conns.value);
        const connection = conns.value[contact.value];
        connection.conn.send(data);
        connection.items.push({
            type: 'message',
            data: data.message,
            me: true,
            dt: new Date().toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric' })
        });
        message.value = '';
        return
    }
}

async function open_chat(item) {
    console.log('Opening chat:', item);
    // Check if connection exists
    if (conns.value.hasOwnProperty(item) && conns.value[item].conn) {
        conns.value[item].notification = false;
        contact.value = item;
        nextTick().then(() => {
            textarea.value.focus();
        })
        return
    }

    // Create connection
    const totp = await generate_totp(item);
    const connection = peer.value.connect(totp, {
        reliable: true,
        metadata: {
            from: secret.value,
            to: item
        }
    })
    console.log('Connection created:', connection);
    connection.on('open', () => {
        console.log('Connected to:', item);
        contact.value = item;
        nextTick().then(() => {
            textarea.value.focus();
        })
    })
    handle_outgoing_connection(connection);
}

async function handle_incoming_connection(connection) {
    // Add message to list
    connection.on('data', (data) => {
        // Set notification
        if (contact.value !== connection.metadata.from) {
            conns.value[connection.metadata.from].notification = true;
        }

        // Add message
        if (data.type === 'message') {
            conns.value[connection.metadata.from].items.push({
                type: 'message',
                data: data.message,
                me: false,
                dt: new Date().toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric' })
            });
        }
    });

    // Add connection to list
    conns.value[connection.metadata.from] = {
        conn: connection,
        items: []
    }
}

async function handle_outgoing_connection(connection) {
    // Add message to list
    connection.on('data', (data) => {
        if (data.type === 'message') {
            conns.value[connection.metadata.to].items.push({
                type: 'message',
                data: data.message,
                me: false,
                dt: new Date().toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric' })
            });
        }
    });

    // Add connection to list
    conns.value[connection.metadata.to] = {
        conn: connection,
        items: []
    }
}

async function peer_setup() {
    // Create peer
    const totp = await generate_totp(secret.value);
    peer.value = new Peer([totp]);
    peer.value.on('connection', (connection) => {
        handle_incoming_connection(connection);
    })
    console.log('New Peer created:', totp);
}

onBeforeMount(async () => {
    // Generate one time secret if empty
    if (localStorage.getItem('secret') === null) {
        localStorage.setItem('secret', await generate_secret());
    }
    secret.value = localStorage.getItem('secret');
    console.log('Secret:', secret.value);
    peer_setup();

    // Create connection templates
    for (const item of contacts) {
        conns.value[item] = {
            conn: null,
            items: []
        }
    }

    // Check url for add parameter
    const url = new URL(window.location.href);
    const add = url.searchParams.get('add');
    if (add) open_chat(add);

    // Create qr code
    QRCode.toDataURL(`https://messenger.buzl.uk/?add=${secret.value}`, {
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

    // Generate TOTP
    get_countdown();

    // Loop every second
    setInterval(() => {
        get_countdown();
    }, 1000);
})
</script>