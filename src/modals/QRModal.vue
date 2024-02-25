<template>
    <div v-if="visible" class="overlay">
        <div class="overlay-container d-flex flex-column bg-white border rounded shadow p-3 z-1">
            <div class="d-flex justify-content-end mb-3">
                <button class="btn btn-close" @click="hide"></button>
            </div>
            <p class="mb-0">Scan this QR code to connect or click on it to copy.</p>
            <img :src="qrcode" class="qr-code" @click="copy_qrcode">
        </div>
        <div class="overlay-outside" @click="hide"></div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { secrets } from '/js/store.js';
import QRCode from 'qrcode'

const visible = ref(false);

// qrcode
const qrcode = ref(null);

function hide() {
    visible.value = false;
}

async function show_qr() {
    qrcode.value = await QRCode.toDataURL(secrets.secret, {
        errorCorrectionLevel: 'H',
        type: 'image/jpeg',
        quality: 1,
        margin: 1,
        width: 256,
        color: {
            dark: '#000000',
            light: '#ffffff'
        }
    });
    visible.value = true;
}


async function copy_qrcode() {
    await navigator.clipboard.writeText(secrets.secret);
}

defineExpose({
    show: show_qr,
    hide,
});
</script>