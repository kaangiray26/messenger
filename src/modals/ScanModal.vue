<template>
    <div v-if="visible" class="overlay-dark p-3">
        <div class="d-flex flex-column rounded p-3 z-1">
            <canvas ref="canvas"></canvas>
            <span class="text-center text-light mt-3">Scan a Messenger QR code</span>
            <button class="btn btn-outline-light mt-1 mx-auto" @click="reset">Cancel</button>
        </div>
    </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { store, secrets } from '/js/store.js';
import jsQR from "jsqr";

const visible = ref(false);
const emit = defineEmits(['update_results']);

// qrcode
const video = ref(null);
const canvas = ref(null);
const context = ref(null);

async function reset() {
    visible.value = false;
    video.value.srcObject.getTracks().forEach(track => track.stop());
    video.value.remove();
    canvas.value.remove();
    context.value = null;
    video.value = null;
    canvas.value = null;
}

async function scan() {
    visible.value = true;
    await nextTick();

    video.value = document.createElement("video");
    context.value = canvas.value.getContext("2d");

    navigator.mediaDevices
        .getUserMedia({
            video: {
                facingMode: "environment"
            }, audio: false
        })
        .then((stream) => {
            video.value.srcObject = stream;
            video.value.setAttribute("playsinline", true);
            video.value.play();
            requestAnimationFrame(tick);
        })
        .catch((err) => {
            console.error(`An error occurred: ${err}`);
        });
}

function drawLine(begin, end, color) {
    context.value.beginPath();
    context.value.moveTo(begin.x, begin.y);
    context.value.lineTo(end.x, end.y);
    context.value.lineWidth = 4;
    context.value.strokeStyle = color;
    context.value.stroke();
}

function tick() {
    if (!visible.value) return;
    if (video.value.readyState === video.value.HAVE_ENOUGH_DATA) {
        canvas.value.height = video.value.videoHeight;
        canvas.value.width = video.value.videoWidth;
        context.value.drawImage(video.value, 0, 0, canvas.value.width, canvas.value.height);

        let imageData = context.value.getImageData(0, 0, canvas.value.width, canvas.value.height);
        let code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        });

        if (code) {
            drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
            drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
            drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
            drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");

            add_contact(code.data);
            reset();
        }
    }
    requestAnimationFrame(tick);
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
    show: scan
});
</script>