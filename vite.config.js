import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    server: {
        proxy: {
            '/categories': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false
            },
            '/products': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false
            },
            '/stocks': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false
            }
        }
    }
})