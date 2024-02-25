// store.js

import { reactive } from "vue";

const store = reactive({
    db: null,
    peer: null,
    chunks: [],
    focus: true,
    contact: null,
    contacts: [],
    connections: {},
})

const secrets = reactive({
    name: null,
    token: null,
    secret: null,
    pubkey: null,
    privkey: null,
})

export { store, secrets }