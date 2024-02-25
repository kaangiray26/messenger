<template>
    <div v-if="visible" class="overlay">
        <div class="overlay-container d-flex flex-column bg-light border rounded shadow p-3 z-1">
            <span class="fw-bold mb-3">Enter code</span>
            <div class="input-group mb-3">
                <span class="input-group-text bi bi-qr-code" id="basic-code"></span>
                <input v-model="code_input" type="text" class="form-control" placeholder="Code" aria-label="Code"
                    aria-describedby="basic-code" @keypress.enter="add_code" autofocus>
            </div>
            <div class="d-flex justify-content-end">
                <button class="btn btn-primary me-2" @click="add_code">Add</button>
                <button class="btn btn-secondary" @click="visible = false">Cancel</button>
            </div>
        </div>
        <div class="overlay-outside" @click="clicked_outside"></div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { store, secrets } from '/js/store.js';

const visible = ref(false);
const emit = defineEmits(['update_results']);

const code_input = ref('');

async function clicked_outside() {
    visible.value = false;
}

async function add_code() {
    if (!code_input.value.length) return;
    add_contact(code_input.value);

    // Close the modal
    visible.value = false;
    code_input.value = '';
}

async function add_contact(item) {
    // Check for contact in database to see if it already exists
    const found = await store.db.getFromIndex('contacts', 'secret', item);
    if (found) return;

    const connection = store.peer.connect(item, {
        reliable: true,
        metadata: {
            from: secrets.secret,
            to: item
        }
    })

    connection.on('open', () => {
        connection.send({
            type: "handshake",
            name: secrets.name,
            secret: secrets.secret,
            pubkey: secrets.pubkey.armor()
        })
    })

    connection.on('data', async (data) => {
        if (data.type == "handshake") {
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
            emit('update_results');
            // Close connection
            connection.close();
        }
    })
}

defineExpose({
    show: () => visible.value = true,
    hide: () => visible.value = false,
});
</script>