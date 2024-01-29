import { createApp } from 'vue'
import App from '/components/App.vue'

// Import our custom CSS
import '/scss/styles.scss'
import '/assets/styles.css'

async function register_worker() {
    if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register("/messenger/serviceworker.js", {
            scope: "/messenger/"
        });
    }
}

register_worker().then(() => {
    createApp(App).mount('#app');
})