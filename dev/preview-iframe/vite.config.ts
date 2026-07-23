import babel from '@rolldown/plugin-babel'
import viteReact, {reactCompilerPreset} from '@vitejs/plugin-react'
import {defineConfig} from 'vite'

export default defineConfig({
  plugins: [viteReact(), babel({presets: [reactCompilerPreset({target: '19'})]})],
  server: {
    port: 3334,
    strictPort: true,
  },
  preview: {
    port: 3334,
    strictPort: true,
  },
})
