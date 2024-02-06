import { createApp } from 'vue'
import App from '/components/App.vue'

// Import our custom CSS
import '/scss/styles.scss'
import '/assets/styles.css'

async function register_worker() {
    if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        console.log('Service Worker Registered');
    }
}

createApp(App).mount('#app');
// register_worker().then(() => {
// })