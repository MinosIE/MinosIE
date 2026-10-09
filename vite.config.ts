import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // 部署在 https://minosie.github.io/MinosIE/ 子路径下
  base: '/MinosIE/',
})
