<template>
    <div v-if="calling" class="overlay-fullscreen">
        <div class="d-flex flex-column bg-light rounded shadow p-3">
            <h5 class="fw-bold text-center">Messenger Video Call</h5>
            <span class="text-center">{{ name }}</span>
            <div class="d-flex justify-content-center mt-3">
                <img src="/images/person.svg" class="avatar">
            </div>
            <hr>
            <div class="d-flex justify-content-center">
                <video ref="video" class="img-fluid rounded" autoplay playsinline muted></video>
            </div>
            <div class="d-flex align-items-center justify-content-center mt-3">
                <span class="spinner-grow spinner-grow-sm me-2" aria-hidden="true"></span>
                <span role="status">Calling...</span>
            </div>
            <div class="d-flex justify-content-around">
                <button class="btn btn-danger mt-3" @click="stop_call">Cancel</button>
            </div>
        </div>
    </div>
    <div v-if="incoming" class="overlay-fullscreen">
        <div class="d-flex flex-column bg-light rounded shadow p-5">
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
    <div v-if="in_call" class="overlay-fullscreen bg-light">
        <div class="d-flex h-100 w-100 position-relative">
            <video ref="dst_video" class="videocall-dst" autoplay playsinline></video>
            <video ref="src_video" class="videocall-src" autoplay playsinline></video>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const name = ref(null);
const call = ref(null);

const video = ref(null);
const dst_video = ref(null);

const calling = ref(false);
const incoming = ref(false);
const in_call = ref(false);

const props = defineProps({
    peer: Object
})

async function accept_call() {
    console.log("Call accepted");

    // Set values
    calling.value = false;
    incoming.value = false;
    in_call.value = true;

    // Get mediastream
    const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

    // Show stream
    video.value.srcObject = mediaStream;

    // Answer call
    call.value.answer(mediaStream);
}

async function decline_call() {
    // Close call
    call.value.close();
    incoming.value = false;
    console.log("Call declined");
}

async function make_call(contact_secret, contact_name) {
    // Set values
    name.value = contact_name;

    // Set calling to true
    calling.value = true;

    // Get mediastream
    const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

    // Set call
    const call = props.peer.call(contact_secret, mediaStream, {
        metadata: {
            'secret': props.peer.id,
            'type': 'videocall',
        }
    });

    call.on('stream', (remoteStream) => {
        // Set values
        calling.value = false;
        incoming.value = false;
        in_call.value = true;

        src_video.value.srcObject = mediaStream;
        dst_video.value.srcObject = remoteStream;
    })

    call.on('close', () => {
        console.log("Call closed");
        call.value.close();
        incoming.value = false;
    })

    call.on('error', (err) => {
        console.log("Call error", err);
    })
}

async function incoming_call(_call, caller_id, caller_name) {
    // Set values
    name.value = caller_name;

    // Get name from metadata
    incoming.value = true;

    // Set call
    call.value = _call;
}

async function stop_call() {
    calling.value = false;
    console.log("Call stopped");
}

defineExpose({
    make_call,
    incoming_call
})
</script>