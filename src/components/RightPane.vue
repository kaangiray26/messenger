<template>
    <div v-if="contact" class="right-pane" :class="{ 'd-block col-12': contact }">
        <div class="d-flex flex-column h-100">
            <div class="contact-header">
                <span class="material-symbols-outlined clickable me-3" @click="emit('close')">
                    arrow_back
                </span>
                <img src="/images/person.svg" class="avatar me-2">
                <div class="text-truncate">
                    <span class="name">{{ contact.name }}</span>
                </div>
                <div class="d-flex align-items-center ms-auto">
                    <div class="icon-btn me-2" @click="emit('videocall')">
                        <span class="material-symbols-outlined">video_call</span>
                    </div>
                    <div class="icon-btn me-2" @click="emit('voicecall')">
                        <span class="material-symbols-outlined">call</span>
                    </div>
                    <div class="dropdown">
                        <span class="material-symbols-outlined dropdown-toggle" role="button" data-bs-toggle="dropdown"
                            aria-expanded="false">
                            more_vert
                        </span>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li class="dropdown-li">
                                <a class="dropdown-item" @click="emit('changing')">
                                    <span class="bi bi-pencil-fill pe-1"></span>
                                    Change name
                                </a>
                            </li>
                            <li class="dropdown-li">
                                <a class="dropdown-item" @click="emit('clear_chat')">
                                    <span class="bi bi-eraser-fill pe-1"></span>
                                    Clear chat
                                </a>
                            </li>
                            <li class="dropdown-li">
                                <a class="dropdown-item" @click="emit('remove_contact')">
                                    <span class="bi bi-trash-fill pe-1"></span>
                                    Remove contact
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div ref="messages" class="messages">
                <div v-for="(item, index) in conns[contact.secret].items" class="message shadow" :class="{ 'me': item.me }">
                    <span class="text selectable">{{ item.data }}</span>
                    <span class="time">{{ item.dt }}</span>
                </div>
            </div>
            <div class="textarea-container">
                <textarea ref="textarea" v-model="message" class="form-control" placeholder="Message" rows="1"
                    @keypress="handle_keys" @input="handle_input" @focus="open_keyboard"></textarea>
                <div class="send-button" @click="handle_send">
                    <span class="material-symbols-outlined">
                        send
                    </span>
                </div>
            </div>
        </div>
    </div>
    <div v-if="!contact" class="pane-cover" :class="{ 'd-block col-12': contact }"></div>
</template>

<script setup>
import { ref, nextTick } from 'vue';

const emit = defineEmits(['close', 'send_message', 'changing', 'clear_chat', 'remove_contact', 'videocall', 'voicecall']);

// textarea
const message = ref('');
const textarea = ref(null);

// messages
const messages = ref(null);

const props = defineProps({
    contact: Object,
    conns: Object,
    desktop: Boolean
})

async function open_keyboard() {
    if ("virtualKeyboard" in navigator) {
        navigator.virtualKeyboard.show();
        nextTick(() => {
            messages.value.scroll({
                top: messages.value.scrollHeight,
                behavior: 'smooth'
            })
        })
    }
}

async function handle_keys(event) {
    if (props.desktop && !event.shiftKey && event.key === 'Enter') {
        textarea.value.focus();
        event.preventDefault();

        // Return if message is empty
        if (!message.value.length) return;

        // Send message
        emit('send_message', {
            'message': message.value,
            'contact': props.contact
        });

        // Clear message
        message.value = '';
    }
}

async function handle_send() {
    textarea.value.focus();

    // Return if message is empty
    if (!message.value.length) return;

    // Send message
    emit('send_message', {
        'message': message.value,
        'contact': props.contact
    });

    // Clear message
    message.value = '';
}

async function handle_input() {
    // Check how many lines the textarea has
    let lines = textarea.value.value.split('\n').length;

    if (lines > 5) {
        lines = 5;
    }

    textarea.value.rows = lines;
}

async function focus_chat() {
    nextTick(() => {
        if (props.desktop) textarea.value.focus();
        messages.value.scroll({
            top: messages.value.scrollHeight,
            behavior: 'auto'
        })
    })
}

function scroll_messages() {
    nextTick(() => {
        messages.value.scroll({
            top: messages.value.scrollHeight,
            behavior: 'auto'
        })
    })
}

defineExpose({
    focus_chat,
    scroll_messages
})
</script>