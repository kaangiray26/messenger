<template>
    <div v-if="store.contact" class="right-pane" :class="{ 'd-block col-12': store.contact }">
        <div class="d-flex flex-column h-100">
            <div class="contact-header">
                <span class="material-symbols-outlined clickable me-3" @click="store.contact = null">
                    arrow_back
                </span>
                <img src="/images/person.svg" class="avatar me-2">
                <div class="d-flex flex-column text-truncate">
                    <span class="name fw-bold">{{ store.contact.name }}</span>
                    <small>{{ get_status() }}</small>
                </div>
                <div class="d-flex align-items-center ms-auto">
                    <div class="icon-btn me-2" @click="emit('videocall')">
                        <span class="material-symbols-outlined">video_call</span>
                    </div>
                    <div class="icon-btn me-2" @click="emit('voicecall')">
                        <span class="material-symbols-outlined">call</span>
                    </div>
                    <div class="dropdown">
                        <span class="material-symbols-outlined dropdown-toggle" role="button" data-bs-toggle="dropdown"
                            aria-expanded="false">
                            more_vert
                        </span>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li class="dropdown-li">
                                <a class="dropdown-item" @click="changename_modal.show">
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
                <div v-for="(item, index) in store.connections[store.contact.secret].items" class="message shadow"
                    :class="{ 'me': item.me }">
                    <span class="text selectable">{{ item.data }}</span>
                    <span class="time">{{ item.dt }}</span>
                </div>
            </div>
            <div class="textarea-container">
                <textarea ref="textarea" v-model="message" class="form-control" placeholder="Message" rows="1"
                    @keypress="handle_keys" @input="handle_input" @focus="open_keyboard"></textarea>
                <!-- File send -->
                <!-- <div class="file-send">
                    <input ref="file_input" type="file" class="d-none" @change="handle_file">
                    <span class="material-symbols-outlined clickable" @click="file_input.click">
                        attach_file
                    </span>
                </div> -->
                <div class="send-button" @click="handle_send">
                    <span class="material-symbols-outlined">
                        send
                    </span>
                </div>
            </div>
        </div>
    </div>
    <div v-if="!store.contact" class="pane-cover" :class="{ 'd-block col-12': store.contact }"></div>
    <ChangeNameModal ref="changename_modal" />
</template>

<script setup>
import { ref, nextTick, onBeforeMount } from 'vue';
import { store, secrets } from '/js/store.js';
import { readKey, encrypt, decrypt, createMessage, readMessage } from 'openpgp';
import { Dropdown } from 'bootstrap';
import ChangeNameModal from '../modals/ChangeNameModal.vue';

const emit = defineEmits(['videocall', 'voicecall']);

// chunk size
const chunk_size = 1024 * 512;

// textarea
const message = ref('');
const textarea = ref(null);

const file_input = ref(null);

// messages
const messages = ref(null);

// desktop
const desktop = ref(false);

// modals
const changename_modal = ref(null);

async function send_packet(contact, packet) {
    // 1: Use the already present connection and send the message
    if (store.connections[contact.secret].conn) {
        const connection = store.connections[contact.secret];
        connection.metadata = {
            from: secrets.secret,
            to: contact.secret,
        }
        connection.conn.send(packet);
        return
    }

    // 2: Try to create a new connection and send the message
    const connection = store.peer.connect(contact.secret, {
        reliable: true,
        metadata: {
            from: secrets.secret,
            to: contact.secret,
        },
    })
    connection.on('open', async () => {
        handle_outgoing_connection(connection);
        connection.send(packet);
        return
    })
}

async function send_file(data) {
    // Get file details
    const details = {
        'name': data.file.name,
        'type': data.file.type,
        'chunks': Math.ceil(data.file.size / chunk_size),
    }

    // Encrypt details
    const encrypted = await encrypt({
        message: await createMessage({ text: JSON.stringify(details) }),
        encryptionKeys: await readKey({ armoredKey: data.contact.pubkey }),
    });

    // Create a secret for the chunks
    const id = crypto.getRandomValues(new Uint8Array(16)).reduce((p, i) => p + (i % 16).toString(16), '');
    const packet = {
        type: 'file',
        file_id: id,
        details: encrypted
    }
    send_packet(data.contact, packet);
    return
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
    const tx = store.db.transaction('messages', 'readwrite');
    await tx.store.put(msg);

    // Add to chat
    store.connections[data.contact.secret].items.push(msg);

    // Scroll down
    scroll_messages();

    // 1: Use the already present connection and send the message
    if (store.connections[data.contact.secret].conn) {
        const connection = store.connections[data.contact.secret];
        connection.metadata = {
            from: secrets.secret,
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
    const connection = store.peer.connect(data.contact.secret, {
        reliable: true,
        metadata: {
            from: secrets.secret,
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

async function handle_outgoing_connection(connection) {
    // Add message to list
    connection.on('data', async (data) => {
        console.log('Outgoing data:', data, connection.metadata);
        // Handle message
        if (data.type === 'message') {
            // Decrypt message
            const decrypted = await decrypt({
                message: await readMessage({ armoredMessage: data.message }),
                decryptionKeys: secrets.privkey
            });

            // Set notification
            const isOpen = store.contact && store.contact.secret == connection.metadata.to;

            if (!isOpen) {
                store.connections[connection.metadata.to].notification += 1;
                create_notification(connection.metadata.to, decrypted.data);
            } else if (!store.focus) {
                create_notification(connection.metadata.from, decrypted.data);
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
            const tx = store.db.transaction('messages', 'readwrite');
            await tx.store.put(msg);

            // Add to chat
            store.connections[connection.metadata.to].items.push(msg);

            // Scroll down
            if (isOpen) {
                scroll_messages();
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
        store.connections[connection.metadata.to].conn = null;
    })

    // Add connection to list
    if (store.connections[connection.metadata.to]) {
        store.connections[connection.metadata.to].conn = connection;
        return
    }
    store.connections[connection.metadata.to] = {
        conn: connection,
        items: [],
        notification: false,
        pubkey: null,
        online: false,
        last_seen: 0,
    }
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

async function handle_keys(event) {
    if (desktop.value && !event.shiftKey && event.key === 'Enter') {
        textarea.value.focus();
        event.preventDefault();

        // Return if message is empty
        if (!message.value.length) return;

        // Send message
        send_message({
            'message': message.value,
            'contact': store.contact
        });

        // Clear message
        message.value = '';
    }
}

async function handle_file() {
    const file = file_input.value.files[0];

    // Send file
    send_file({
        'file': file,
        'contact': store.contact
    });
}

async function handle_send() {
    textarea.value.focus();

    // Return if message is empty
    if (!message.value.length) return;

    // Send message
    send_message({
        'message': message.value,
        'contact': store.contact
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

async function focus_chat() {
    nextTick(() => {
        if (desktop.value) textarea.value.focus();
        messages.value.scroll({
            top: messages.value.scrollHeight,
            behavior: 'auto'
        })
    })
}

async function remove_contact() {
    // Remove contact from array
    const index = store.contacts.findIndex(item => item.secret == store.contact.secret);
    store.contacts.splice(index, 1);

    // Update the database
    const tx = store.db.transaction('contacts', 'readwrite');
    await tx.store.delete(store.contact.secret);

    // Remove connection from array
    delete store.connections[store.contact.secret];

    // Close the chat
    store.contact = null;
}

async function clear_chat() {
    const secret = store.contact.secret;

    // Clear the chat
    store.connections[secret].items = [];

    // Clear messages that has the same secret in the index
    const tx = store.db.transaction('messages', 'readwrite');
    const index = tx.store.index('secret');
    const keys = await index.getAllKeys(secret);

    for (const key of keys) {
        await tx.store.delete(key);
    }
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

async function scroll_messages() {
    nextTick(() => {
        messages.value.scroll({
            top: messages.value.scrollHeight,
            behavior: 'auto'
        })
    })
}

function get_status() {
    if (store.connections[store.contact.secret].online) {
        return "Online";
    } else {
        return "Last seen at " + new Date(store.connections[store.contact.secret].last_seen).toLocaleTimeString('en-GB', {
            hour: 'numeric', minute: 'numeric'
        });
    }
}

defineExpose({
    focus_chat,
    scroll_messages
})

onBeforeMount(() => {
    // Set device mode
    if (window.innerWidth > 768) {
        desktop.value = true;
    }
})
</script>