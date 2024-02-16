<template>
    <div v-if="calling" class="overlay-fullscreen">
        <div class="d-flex flex-column bg-light rounded shadow p-3">
            <h5 class="fw-bold text-center">Messenger Voice Call</h5>
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
            <h5 class="fw-bold">Messenger Voice Call</h5>
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
        <div class="voicecall-container">
            <div class="d-flex justify-content-center pt-5">
                <img src="/images/person.svg" class="voicecall-avatar">
            </div>
            <h1 class="fw-bold text-center text-light pt-3 mb-0">{{ name }}</h1>
            <span class="text-center text-light">{{ duration }}</span>
            <audio ref="audio" class="voicecall-audio" autoplay></audio>
        </div>
        <div class="videocall-controls">
            <div class="icon-btn" @click="mute">
                <span class="material-symbols-outlined">
                    {{ muted ? 'mic_off' : 'mic' }}
                </span>
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

// Audio
const audio = ref(null);
const muted = ref(false);
const mediastream = ref(null);

// Call duration
const startTime = ref(null);
const duration = ref('00:00');

const calling = ref(false);
const incoming = ref(false);
const in_call = ref(false);
const closer = ref(false);
const call_available = ref(false);

const props = defineProps({
    peer: Object
})

async function mute() {
    mediastream.value.getAudioTracks()[0].enabled = !mediastream.value.getAudioTracks()[0].enabled;
    muted.value = !mediastream.value.getAudioTracks()[0].enabled;
}

async function end_call() {
    closer.value = true;
    await close();
    call.value.close();
}

async function close() {
    name.value = null;
    startTime.value = null;

    muted.value = ref(false);

    startTime.value = null;
    duration.value = '00:00';

    calling.value = false;
    incoming.value = false;
    in_call.value = false;
    call_available.value = false;

    // Stop audio stream
    audio.value.pause();
    audio.value.srcObject = null;

    // Stop mediastream
    if (!mediastream.value) return;
    mediastream.value.getTracks().forEach(track => track.stop());
    mediastream.value = null;
}

async function handle_incoming_call(incoming_call) {
    // Handlers
    incoming_call.on('stream', (remoteStream) => {
        audio.value.srcObject = remoteStream;
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
        audio.value.srcObject = remoteStream;
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

async function accept_call() {
    switch_to_in_call();

    // Get mediastream
    mediastream.value = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

    // Answer call
    await handle_incoming_call(call.value)
    call.value.answer(mediastream.value);
}

async function decline_call() {
    // Close call
    call.value.close();
    incoming.value = false;
}

function switch_to_in_call() {
    // Set values
    calling.value = false;
    incoming.value = false;
    in_call.value = true;

    // Set start time
    startTime.value = new Date().getTime();

    // Set duration
    setInterval(() => {
        const currentTime = new Date().getTime();
        const timeDifference = currentTime - startTime.value;
        duration.value = new Date(timeDifference).toLocaleTimeString('en-GB', { minute: 'numeric', second: 'numeric' });
    }, 1000);
}

async function make_call(contact_secret, contact_name) {
    console.log("Making voice call...");
    // Reset closer value
    closer.value = false;

    // Set values
    name.value = contact_name;

    // Set calling to true
    calling.value = true;

    // Get mediastream audio only no video
    mediastream.value = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

    // Set call
    const outgoing_call = props.peer.call(contact_secret, mediastream.value, {
        metadata: {
            'secret': props.peer.id,
            'type': 'voicecall',
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