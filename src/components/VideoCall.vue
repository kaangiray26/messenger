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
            <video ref="src_video" class="videocall-src" autoplay playsinline muted></video>
        </div>
        <div class="videocall-controls">
            <div class="icon-btn" @click="switch_camera">
                <span class="material-symbols-outlined">flip_camera_ios</span>
            </div>
            <div class="icon-btn" @click="toggle_camera">
                <span class="material-symbols-outlined">
                    {{ camera ? 'videocam_off' : 'videocam' }}
                </span>
            </div>
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

// Video
const muted = ref(false);
const camera = ref(false);
const mediastream = ref(null);
const extrastream = ref(null);
const device_index = ref(0);

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

async function switch_camera() {
    // Get video devices
    const devices = await navigator.mediaDevices.enumerateDevices();
    const video_devices = devices.filter(device => device.kind === 'videoinput');

    // Get next device
    device_index.value = (device_index.value + 1) % video_devices.length;
    console.log("Switching camera to:", video_devices[device_index.value].label);

    // Stop mediastream
    mediastream.value.getTracks().forEach(track => {
        if (track.kind === 'video') {
            track.stop();
        }
    });

    // Get mediastream
    const stream = await navigator.mediaDevices.getUserMedia({
        video: {
            deviceId: { exact: video_devices[device_index.value].deviceId }
        }
    });

    // Set own mediastream
    src_video.value.srcObject = stream;

    // Replace tracks
    const senders = call.value.peerConnection.getSenders();
    for (const sender of senders) {
        if (sender.track.kind === 'video') {
            sender.replaceTrack(stream.getVideoTracks()[0]);
        }
    }

    extrastream.value = stream;
}

async function toggle_camera() {
    mediastream.value.getVideoTracks()[0].enabled = !mediastream.value.getVideoTracks()[0].enabled;
    camera.value = !mediastream.value.getVideoTracks()[0].enabled;
}

async function mute() {
    muted.value = !muted.value;
    mediastream.value.getAudioTracks()[0].enabled = !muted.value;
}

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
    if (mediastream.value) {
        mediastream.value.getTracks().forEach(track => track.stop());
        mediastream.value = null;
    }

    // Stop extra mediastream
    if (extrastream.value) {
        extrastream.value.getTracks().forEach(track => track.stop());
        extrastream.value = null;
    }
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
    mediastream.value = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    src_video.value.srcObject = mediastream.value;

    // Answer call
    call.value.answer(mediastream.value);
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
    mediastream.value = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    src_video.value.srcObject = mediastream.value;

    // Set call
    const outgoing_call = props.peer.call(contact_secret, mediastream.value, {
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