<template>
    <div v-if="calling" class="overlay-fullscreen">
        <div class="d-flex flex-column bg-light rounded shadow p-3">
            <h5 class="fw-bold text-center">Messenger Video Call</h5>
            <span class="text-center">{{ name }}</span>
            <div class="d-flex justify-content-center mt-3">
                <img src="/images/person.svg" class="avatar">
            </div>
            <hr>
            <div class="d-flex align-items-center justify-content-center">
                <span class="spinner-grow spinner-grow-sm me-2" aria-hidden="true"></span>
                <span role="status">Calling...</span>
            </div>
            <div v-if="call_available" class="d-flex justify-content-around">
                <button class="btn btn-danger mt-3" @click="end_call">Cancel</button>
            </div>
        </div>
    </div>
    <div v-if="incoming" class="overlay-fullscreen">
        <div class="d-flex flex-column bg-light rounded shadow p-3">
            <h5 class="fw-bold">Messenger Video Call</h5>
            <div class="d-flex justify-content-center">
                <span>{{ name }}</span>
            </div>
            <div class="d-flex justify-content-center mt-3">
                <img src="/images/person.svg" class="avatar">
            </div>
            <hr>
            <div class="d-flex align-items-center justify-content-center">
                <span class="spinner-grow spinner-grow-sm me-2" aria-hidden="true"></span>
                <span role="status">Incoming call...</span>
            </div>
            <div class="d-flex justify-content-around">
                <button class="btn btn-success mt-3" @click="accept_call">Accept</button>
                <button class="btn btn-danger mt-3" @click="decline_call">Decline</button>
            </div>
        </div>
    </div>
    <div v-show="in_call" class="overlay-fullscreen flex-column bg-black">
        <div class="videocall-container">
            <video ref="dst_video" class="videocall-dst" autoplay playsinline></video>
            <video ref="src_video" class="videocall-src" autoplay playsinline></video>
        </div>
        <div class="videocall-controls">
            <div class="icon-btn">
                <span class="material-symbols-outlined">flip_camera_ios</span>
            </div>
            <div class="icon-btn">
                <span class="material-symbols-outlined">videocam_off</span>
            </div>
            <div class="icon-btn">
                <span class="material-symbols-outlined">mic_off</span>
            </div>
            <div class="call_end-btn" @click="end_call">
                <span class="material-symbols-outlined">call_end</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const name = ref(null);
const call = ref(null);

const src_video = ref(null);
const dst_video = ref(null);

const calling = ref(false);
const incoming = ref(false);
const in_call = ref(false);
const closer = ref(false);
const call_available = ref(false);

const props = defineProps({
    peer: Object
})

async function end_call() {
    closer.value = true;
    await close();
    call.value.close();
}

async function close() {
    name.value = null;

    calling.value = false;
    incoming.value = false;
    in_call.value = false;
    call_available.value = false;

    // Stop remote mediastream
    dst_video.value.srcObject = null;

    // Stop mediastream
    const stream = src_video.value.srcObject;
    if (!stream) return;

    stream.getTracks().forEach(track => track.stop());
    src_video.value.srcObject = null;
}

async function handle_incoming_call(incoming_call) {
    // Handlers
    incoming_call.on('stream', (remoteStream) => {
        dst_video.value.srcObject = remoteStream;
    })

    incoming_call.on('close', async () => {
        if (closer.value) return;
        await close();
        incoming_call.close();

    })

    incoming_call.on('error', (err) => {
        console.log("Call error", err);
    })

    // Save incoming call
    call.value = incoming_call;
}

async function handle_outgoing_call(outgoing_call) {
    // Handlers
    outgoing_call.on('stream', (remoteStream) => {
        switch_to_in_call();
        dst_video.value.srcObject = remoteStream;
    })

    outgoing_call.on('close', async () => {
        if (closer.value) return;
        await close();
        outgoing_call.close();
    })

    outgoing_call.on('error', (err) => {
        console.log("Call error", err);
    })

    // Save outgoing call
    call.value = outgoing_call;
    call_available.value = true;
}

function switch_to_in_call() {
    // Set values
    calling.value = false;
    incoming.value = false;
    in_call.value = true;
}

async function accept_call() {
    switch_to_in_call();

    // Get mediastream
    const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    src_video.value.srcObject = mediaStream;

    // Answer call
    await handle_incoming_call(call.value)
    call.value.answer(mediaStream);
}

async function decline_call() {
    // Close call
    call.value.close();
    incoming.value = false;
}

async function make_call(contact_secret, contact_name) {
    // Reset closer value
    closer.value = false;

    // Set values
    name.value = contact_name;

    // Set calling to true
    calling.value = true;

    // Get mediastream
    const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    src_video.value.srcObject = mediaStream;

    // Set call
    const outgoing_call = props.peer.call(contact_secret, mediaStream, {
        metadata: {
            'secret': props.peer.id,
            'type': 'videocall',
        }
    });
    await handle_outgoing_call(outgoing_call);
}

async function incoming_call(incoming_call, caller_id, caller_name) {
    // Reset closer value
    closer.value = false;

    // Set handlers
    await handle_incoming_call(incoming_call);

    // Set values
    name.value = caller_name;

    // Show incoming call
    incoming.value = true;
}

defineExpose({
    make_call,
    incoming_call
})
</script>