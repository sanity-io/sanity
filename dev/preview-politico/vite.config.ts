import babel from '@rolldown/plugin-babel'
import viteReact, {reactCompilerPreset} from '@vitejs/plugin-react'
import {defineConfig} from 'vite'

export default defineConfig({
  plugins: [viteReact(), babel({presets: [reactCompilerPreset({target: '19'})]})],
  // This app's env vars use a `SANITY_` prefix (not Vite's default `VITE_`),
  // so they need to be explicitly allowed through to `import.meta.env`.
  envPrefix: 'SANITY_',
  server: {
    port: 3335,
    strictPort: true,
  },
  preview: {
    port: 3335,
    strictPort: true,
  },
})
