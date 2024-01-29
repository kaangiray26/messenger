import { createApp } from 'vue'
import App from '/components/App.vue'

// Import our custom CSS
import '/scss/styles.scss'
import '/assets/styles.css'

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register("/serviceworker.js");
}

createApp(App).mount('#app');