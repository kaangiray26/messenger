import { createApp } from 'vue'
import App from '/components/App.vue'

// Import our custom CSS
import '/scss/styles.scss'
import '/assets/styles.css'

async function register() {
    // Register service worker
    if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        if (!registration) {
            console.error('Service Worker registration failed:', err);
            return
        }
        console.info('Service Worker registered with scope:', registration.scope);
    }
}

register().then(() => {
    createApp(App).mount('#app');
})