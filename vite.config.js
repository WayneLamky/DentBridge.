import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages 项目页路径需要 base 前缀；仓库名 DentBridge，URL 就是 /DentBridge/
// 本地 dev 保持 '/'，避免开发时资源路径错乱。
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/DentBridge/' : '/',
  plugins: [react(), tailwindcss()],
}))
