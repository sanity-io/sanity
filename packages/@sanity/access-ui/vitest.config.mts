import {defineConfig} from '@repo/test-config/vitest'
import babel from '@rolldown/plugin-babel'
import viteReact, {reactCompilerPreset} from '@vitejs/plugin-react'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
  },
  plugins: [viteReact(), babel({presets: [reactCompilerPreset({target: '19'})]})],
})
