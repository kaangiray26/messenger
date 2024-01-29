<template>
    <div class="container d-flex flex-fill h-100 py-3">
        <div class="row row-cols-2 g-0 flex-fill shadow">
            <div class="col col-3 left-pane">
                <div class="d-flex flex-column h-100">
                    <div class="d-flex align-items-center p-3">
                        <h1 class="material-symbols pe-2 mb-0">voice_selection</h1>
                        <h1 class="fw-bold mb-0">Messenger</h1>
                    </div>
                    <div class="d-flex px-3 mb-3">
                        <div class="d-inline-flex flex-wrap align-items-center">
                            <span class="me-3">Secret:</span>
                            <input type="text" class="secret" v-model="secret" />
                        </div>
                    </div>
                    <div class="input-group px-2 mb-2">
                        <span class="input-group-text bi bi-search" id="username-search"></span>
                        <input type="text" class="form-control" placeholder="Username" aria-label="Username"
                            aria-describedby="username-search">
                    </div>
                    <div class="contacts">
                        <div v-for="item in contacts" class="contact" @click="open_chat(item)">
                            <img src="/images/person.svg" class="avatar">
                            <span>{{ item }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col col-9 right-pane">
                <div v-if="contact" class="d-flex flex-column h-100">
                    <div class="messages mb-3">
                        <div v-for="(item, index) in items[contact]" class="message shadow" :class="{ 'me': item.me }">
                            <span>{{ item.message }}</span>
                            <span class="time">{{ item.dt }}</span>
                        </div>
                    </div>
                    <textarea ref="textarea" v-model="message" class="form-control" placeholder="Type a message" rows="2"
                        @keypress="handle_keys"></textarea>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onBeforeMount, nextTick } from 'vue';
import { Peer } from 'peerjs';

const countdown = ref(0);
const secret = ref(null);

// textarea
const message = ref('');
const textarea = ref(null);

// PeerJS
const peer = ref(null);
const conn = ref(null);
// const conns = ref([]);
const conns = ref({});

// messages
const items = ref({});

// contacts
const contact = ref(null);
const contacts = ['eb864056d578fbca', '1e206d8eff4f4eac'];

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

async function send_message(data) {
    console.log(data, contact.value, conns.value);
    // Check if connection exists
    if (conns.value.hasOwnProperty(contact.value)) {
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
    // Check if connection exists
    if (conns.value.hasOwnProperty(item)) {
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
    connection.on('open', () => {
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
        console.log(data, connection.metadata.from);
        if (data.type === 'message') {
            conns.value[connection.metadata.from].items.push({
                type: 'message',
                data: data.message,
                me: false,
                dt: new Date().toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric' })
            });
        }
    });
    conns.value[connection.metadata.from] = {
        conn: connection,
        items: []
    }
}

async function handle_outgoing_connection(connection) {
    // Add message to list
    connection.on('data', (data) => {
        console.log(data, connection.metadata.to);
        if (data.type === 'message') {
            conns.value[connection.metadata.to].items.push({
                type: 'message',
                data: data.message,
                me: false,
                dt: new Date().toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric' })
            });
        }
    });
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
    peer_setup();

    // Generate TOTP
    get_countdown();

    // Loop every second
    setInterval(() => {
        get_countdown();
    }, 1000);
})
</script>