import {defineConfig} from 'sanity'

import baseConfig from '../sanity.config'
import {apiConfig} from '../studio/apiConfig'
import {
  customInputsWorkspace,
  debugLoopWorkspace,
  documentActionsWorkspace,
  listenQueryPaneWorkspace,
  previewHeavyWorkspace,
  structurePaneWorkspace,
} from '../studio/schemas/customizations'
import {wrappedFormWorkspace} from '../studio/schemas/wrappedForm'

/**
 * The CUSTOMIZATION build's config: every pristine workspace (so the vanilla
 * settle-control scenarios run on this dist too) plus one workspace per
 * customization scenario, each at the scenario's basePath. This is a
 * separate nested studio project on purpose — the default build's input
 * graph (../sanity.config.ts and everything it imports) is untouched by
 * anything here, so the pristine dist every gated metric measures stays
 * byte-identical BY CONSTRUCTION. The studio config eagerly compiles every
 * workspace's schema at boot and bundle size is a reported metric, which is
 * why these workspaces must not ride along in the default build.
 *
 * Built via `pnpm --filter bench build:customizations`
 * → perf/bench/dist-customizations (+ bench-build-flags.json, which the
 * runner uses to tell dist flavors apart).
 */
const common = {
  ...apiConfig,
  scheduledPublishing: {enabled: false},
  releases: {enabled: false},
}

export default defineConfig([
  ...baseConfig,
  {basePath: '/previewHeavy', ...common, ...previewHeavyWorkspace},
  {basePath: '/customInputs', ...common, ...customInputsWorkspace},
  {basePath: '/documentActions', ...common, ...documentActionsWorkspace},
  {basePath: '/debugLoop', ...common, ...debugLoopWorkspace},
  {basePath: '/structurePane', ...common, ...structurePaneWorkspace},
  {basePath: '/listenQueryPane', ...common, ...listenQueryPaneWorkspace},
  {basePath: '/wrappedForm', ...common, ...wrappedFormWorkspace},
])
