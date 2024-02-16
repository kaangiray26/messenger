<template>
    <div v-if="calling" class="overlay-fullscreen">
        <div class="d-flex flex-column bg-light rounded shadow p-5">
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
                <span role="status">Calling...</span>
            </div>
            <div class="d-flex justify-content-around">
                <button class="btn btn-danger mt-3" @click="stop_call">Cancel</button>
            </div>
        </div>
    </div>
    <div v-if="incoming" class="overlay-fullscreen">
        <div class="d-flex flex-column bg-light rounded shadow p-5">
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
</template>

<script setup>
import { ref } from 'vue';

const name = ref(null);
const call = ref(null);
const calling = ref(false);
const incoming = ref(false);

const props = defineProps({
    peer: Object
})

async function accept_call() {
    console.log("Call accepted");

    // Get mediastream
    const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

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

    // Set callng to true
    calling.value = true;

    // Get mediastream
    const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

    // Set call
    const call = props.peer.call(contact_secret, mediaStream, {
        metadata: {
            'secret': props.peer.id,
            'type': 'voicecall',
        }
    });

    call.on('stream', (remoteStream) => {
        console.log("Stream", remoteStream);
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