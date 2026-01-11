import {defineConfig} from 'vite'
import {sanityStudioPlugin} from 'sanity/vite'

export default defineConfig({
  plugins: [sanityStudioPlugin()],
})
