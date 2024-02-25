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
                            <a class="dropdown-item" @click="changename_modal.show">
                                <span class="bi bi-pencil-fill pe-1"></span>
                                Change name
                            </a>
                        </li>
                        <li class="dropdown-li">
                            <a class="dropdown-item" @click="qr_modal.show">
                                <span class="bi bi-qr-code pe-1"></span>
                                Show QR
                            </a>
                        </li>
                        <li class="dropdown-li">
                            <a class="dropdown-item" @click="scan_modal.show">
                                <span class="bi bi-qr-code-scan pe-1"></span>
                                Scan QR
                            </a>
                        </li>
                        <li class="dropdown-li">
                            <a class="dropdown-item" @click="addcode_modal.show">
                                <span class="bi bi-key-fill pe-1"></span>
                                Add code
                            </a>
                        </li>
                        <li class="dropdown-li">
                            <a class="dropdown-item" @click="logout_modal.show">
                                <span class="bi bi-door-open-fill pe-1"></span>
                                Log out
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="d-flex px-3 mb-3">
                <span class="fw-bold selectable">{{ secrets.name }}</span>
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
                    <div class="d-flex justify-content-end align-items-start ms-1">
                        <small v-show="store.connections[item.secret].notification" class="notification">{{
                            store.connections[item.secret].notification }}</small>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <LogoutModal ref="logout_modal" />
    <AddCodeModal ref="addcode_modal" @update_results="update_results" />
    <ChangeNameModal ref="changename_modal" @update_results="update_results" />
    <ScanModal ref="scan_modal" />
    <QRModal ref="qr_modal" />
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { store, secrets } from '/js/store.js';
import Fuse from 'fuse.js'
import LogoutModal from '/modals/LogoutModal.vue';
import AddCodeModal from '../modals/AddCodeModal.vue';
import ChangeNameModal from '../modals/ChangeNameModal.vue';
import ScanModal from '../modals/ScanModal.vue';
import QRModal from '../modals/QRModal.vue';

// input
const query = ref('');
const results = ref([]);

// fuzzy search
const fuse = ref(null);

// emits
const emit = defineEmits(['open_chat']);

// modals
const logout_modal = ref(null);
const addcode_modal = ref(null);
const changename_modal = ref(null);
const scan_modal = ref(null);
const qr_modal = ref(null);

async function open_chat(item) {
    emit('open_chat', item);
}

async function requestPermission() {
    if (Notification.permission === 'granted') return;
    Notification.requestPermission().then((result) => {
        window.location.href = window.location.origin + window.location.pathname;
    });
}

async function get_results() {
    if (!query.value.length) {
        results.value = store.contacts;
        return;
    }
    results.value = fuse.value.search(query.value).map(item => item.item);
}

async function update_results() {
    fuse.value.setCollection(store.contacts);
    results.value = store.contacts;
}

async function hide_qr() {
    qr_modal.value.hide();
}

defineExpose({
    update_results,
    hide_qr,
})

onMounted(() => {
    // Create fuzzy search
    fuse.value = new Fuse(store.contacts, {
        keys: ['name', 'secret'],
        threshold: 0.3,
    })
})
</script>