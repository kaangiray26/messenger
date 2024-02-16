<template>
    <div v-if="visible" id="qr">
        <div class="qr-container d-flex flex-column bg-white shadow p-3">
            <div class="d-flex justify-content-end mb-3">
                <button class="btn btn-close" @click="hide"></button>
            </div>
            <p class="mb-0">Scan this QR code to connect or click on it to copy.</p>
            <img :src="qrcode" class="qr-code" @click="copy_qrcode">
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const visible = ref(false);

// Emits
const emit = defineEmits(['close']);


const props = defineProps({
    qrcode: String,
    qrcode_data: String,
})

async function copy_qrcode() {
    await navigator.clipboard.writeText(props.qrcode_data);
}

function show() {
    visible.value = true;
}

function hide() {
    visible.value = false;
}

defineExpose({ show, hide });
</script>