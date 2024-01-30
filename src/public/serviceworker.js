self.addEventListener('install', (event) => {
    console.log('Service worker installed.');
});

self.addEventListener('activate', (event) => {
    console.log('Service worker activated.');
});

self.addEventListener('message', (event) => {
    console.log("Message received:", event.data);
})