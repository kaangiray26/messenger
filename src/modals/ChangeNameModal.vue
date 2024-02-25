<template>
    <div v-if="visible" class="overlay">
        <div class="overlay-container d-flex flex-column bg-light border rounded shadow p-3 z-1">
            <span class="fw-bold mb-3">Enter a new name</span>
            <div class="input-group mb-3">
                <span class="input-group-text" id="basic-addon1">@</span>
                <input v-model="name_input" type="text" class="form-control" placeholder="Username" aria-label="Username"
                    aria-describedby="basic-addon1" @keypress.enter="change_name" autofocus>
            </div>
            <div class="d-flex justify-content-end">
                <button class="btn btn-primary me-2" @click="change_name">Save</button>
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

// input
const name_input = ref('');

async function clicked_outside() {
    visible.value = false;
}

async function change_name() {
    if (!name_input.value.length) return;

    // If no contact is set change own name
    if (!store.contact) {
        secrets.name = name_input.value;
        await store.db.put('keys', secrets.name, 'name');
        changing.value = false;
        return
    }

    // Find the right contact in the array and change it
    const index = store.contacts.findIndex(item => item.secret == store.contact.secret);
    store.contacts[index].name = name_input.value;

    // Update the database
    const tx = store.db.transaction('contacts', 'readwrite');
    await tx.store.put({
        name: name_input.value.value,
        secret: store.contact.secret,
        pubkey: store.contact.pubkey
    });

    // Close the modal
    visible.value = false;
    name_input.value = '';
}

defineExpose({
    show: () => visible.value = true,
    hide: () => visible.value = false,
});
</script>