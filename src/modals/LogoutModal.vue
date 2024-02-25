<template>
    <div v-if="visible" class="overlay">
        <div class="overlay-container d-flex flex-column bg-light border rounded shadow p-3 z-1">
            <span class="fw-bold mb-3">Are you sure you want to log out?</span>
            <div class="d-flex justify-content-end">
                <button class="btn btn-primary me-2" @click="logout">Yes</button>
                <button class="btn btn-secondary" @click="visible = false">No</button>
            </div>
        </div>
        <div class="overlay-outside" @click="clicked_outside"></div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { store } from '/js/store.js';
import { deleteDB } from 'idb';

const visible = ref(false);

async function clicked_outside() {
    visible.value = false;
}

async function logout() {
    console.log('Logging out...');
    // Clear localStorage
    localStorage.clear();

    // Clear indexedDB
    await store.db.close();
    await deleteDB('messenger');

    // Reload page
    window.location.href = window.location.origin + window.location.pathname;
}

defineExpose({
    show: () => visible.value = true,
    hide: () => visible.value = false,
});
</script>