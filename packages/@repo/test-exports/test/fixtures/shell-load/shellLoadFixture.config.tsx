import {visionTool} from '@sanity/vision'
import {lazy} from 'react'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

import {NavbarWithLazyOnlyInternals} from './NavbarWithLazyOnlyInternals'

/**
 * The studio `shell-load.test.mjs` checks its own detection against: the navbar imports `…-2`
 * statically, which is part of the shell, and a lazily loaded tool imports it too, which is not.
 */
export default defineConfig({
  name: 'default',
  projectId: 'shellload',
  dataset: 'test',
  plugins: [structureTool(), visionTool()],
  studio: {components: {navbar: NavbarWithLazyOnlyInternals}},
  tools: [
    {
      name: 'lazy-only-internals',
      title: 'Lazy only internals',
      component: lazy(() => import('./ToolWithLazyOnlyInternals')),
    },
  ],
})
