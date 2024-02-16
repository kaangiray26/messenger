<template>
    <div class="col-12 col-md-3 left-pane">
        <div class="d-flex flex-column h-100">
            <div class="d-flex align-items-end p-3">
                <div class="d-flex flex-wrap align-items-center">
                    <img class="logo" src="/favicon.svg">
                    <h5 class="fw-bold text-break p-1 mb-0">Messenger</h5>
                </div>
                <div class="dropdown ms-auto">
                    <span class="material-symbols-outlined dropdown-toggle" role="button" data-bs-toggle="dropdown"
                        aria-expanded="false" @click="requestPermission">
                        more_vert
                    </span>
                    <ul class="dropdown-menu">
                        <li class="dropdown-li">
                            <a class="dropdown-item" @click="emit('changing')">
                                <span class="bi bi-pencil-fill pe-1"></span>
                                Change name
                            </a>
                        </li>
                        <li class="dropdown-li">
                            <a class="dropdown-item" @click="emit('show_qr')">
                                <span class="bi bi-qr-code pe-1"></span>
                                Show QR
                            </a>
                        </li>
                        <li class="dropdown-li">
                            <a class="dropdown-item" @click="emit('scan_qr')">
                                <span class="bi bi-qr-code-scan pe-1"></span>
                                Scan QR
                            </a>
                        </li>
                        <li class="dropdown-li">
                            <a class="dropdown-item" @click="emit('adding')">
                                <span class="bi bi-key-fill pe-1"></span>
                                Add code
                            </a>
                        </li>
                        <li class="dropdown-li">
                            <a class="dropdown-item" @click="emit('logging_out')">
                                <span class="bi bi-door-open-fill pe-1"></span>
                                Log out
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="d-flex px-3 mb-3">
                <span class="fw-bold selectable">{{ name }}</span>
            </div>
            <div class="input-group px-3 mb-2">
                <span class="input-group-text bi bi-search" id="username-search"></span>
                <input v-model="query" type="text" class="form-control" placeholder="Search..." aria-label="Username"
                    aria-describedby="username-search" @input="get_results">
            </div>
            <div class="contacts">
                <div v-for="item in results" class="contact" @click="open_chat(item)">
                    <div class="d-flex align-items-center">
                        <img src="/images/person.svg" class="avatar me-2">
                        <div class="d-flex flex-column">
                            <span class="name">{{ item.name }}</span>
                        </div>
                    </div>
                    <div class="d-flex justify-content-end align-items-center">
                        <span v-show="conns[item.secret].notification" class="notification"></span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';

// input
const query = ref('');

// emits
const emit = defineEmits(['open_chat', 'changing', 'show_qr', 'scan_qr', 'adding', 'logging_out']);

const props = defineProps({
    name: String,
    conns: Object,
    contacts: Array,
    results: Array,
    get_results: Function,
})

async function open_chat(item) {
    emit('open_chat', item);
}

async function requestPermission() {
    if (Notification.permission === 'granted') return;
    Notification.requestPermission().then((result) => {
        window.location.href = window.location.origin + window.location.pathname;
    });
}
</script>