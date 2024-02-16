<template>
    <div v-if="qr_visible" id="qr">
        <div class="qr-container d-flex flex-column bg-white shadow p-3">
            <div class="d-flex justify-content-end mb-3">
                <button class="btn btn-close" @click="qr_visible = false"></button>
            </div>
            <p class="mb-0">Scan this QR code to connect or click on it to copy.</p>
            <img :src="qrcode" class="qr-code" @click="copy_qrcode">
        </div>
    </div>
    <div v-if="!ready" class="overlay-blur">
        <div class="d-flex flex-column align-items-center">
            <img src="/images/star.svg" class="loading-icon">
            <span class="my-3">Loading...</span>
            <span class="btn btn-dark" @click="refresh">Refresh</span>
        </div>
    </div>
    <div v-if="changing" class="overlay">
        <div class="d-flex flex-column bg-light rounded shadow p-3">
            <span class="fw-bold mb-3">Enter a new name</span>
            <div class="input-group mb-3">
                <span class="input-group-text" id="basic-addon1">@</span>
                <input ref="name_input" type="text" class="form-control" placeholder="Username" aria-label="Username"
                    aria-describedby="basic-addon1" @keypress.enter="change_name" autofocus>
            </div>
            <div class="d-flex justify-content-end">
                <button class="btn btn-primary me-2" @click="change_name">Save</button>
                <button class="btn btn-secondary" @click="changing = false">Cancel</button>
            </div>
        </div>
    </div>
    <div v-if="logging_out" class="overlay">
        <div class="d-flex flex-column bg-light rounded shadow p-3">
            <span class="fw-bold mb-3">Are you sure you want to log out?</span>
            <div class="d-flex justify-content-end">
                <button class="btn btn-primary me-2" @click="logout">Yes</button>
                <button class="btn btn-secondary" @click="logging_out = false">No</button>
            </div>
        </div>
    </div>
    <div v-if="scanning" class="overlay-dark p-3">
        <div class="d-flex flex-column rounded">
            <canvas ref="canvas"></canvas>
            <span class="text-center text-light mt-3">Scan a Messenger QR code</span>
            <button class="btn btn-outline-light mt-1 mx-auto" @click="stop_qr_scan">Cancel</button>
        </div>
    </div>
    <div v-if="adding" class="overlay">
        <div class="d-flex flex-column bg-light rounded shadow p-3">
            <span class="fw-bold mb-3">Enter code</span>
            <div class="input-group mb-3">
                <span class="input-group-text bi bi-qr-code" id="basic-code"></span>
                <input ref="code_input" type="text" class="form-control" placeholder="Code" aria-label="Code"
                    aria-describedby="basic-code" @keypress.enter="change_name" autofocus>
            </div>
            <div class="d-flex justify-content-end">
                <button class="btn btn-primary me-2" @click="add_code">Add</button>
                <button class="btn btn-secondary" @click="adding = false">Cancel</button>
            </div>
        </div>
    </div>
</template>

<script setup></script>