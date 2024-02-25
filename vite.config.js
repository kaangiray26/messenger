import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const fs = require('fs')
const path = require('path')

// https://vitejs.dev/config/
export default defineConfig({
    root: path.resolve(__dirname, 'src'),
    server: {
        hot: true,
        // port: 8000,
        host: 'messenger.localhost.direct',
        port: 4443,
        https: {
            key: fs.readFileSync('./localhost.direct/localhost.direct.key'),
            cert: fs.readFileSync('./localhost.direct/localhost.direct.crt'),
        },

    },
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
        }
    }
})
