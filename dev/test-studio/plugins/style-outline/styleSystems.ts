// The fingerprints and the census live in @repo/utils so the perf bench's style probe (and, through
// it, Studio Radar) measures exactly what this widget shows — see the module's header comment.
export {STYLE_SYSTEMS, type StyleSystemId} from '@repo/utils/style-systems'

export const STYLE_OUTLINE_ATTRIBUTE = 'data-style-outline'
export const STYLE_OUTLINE_STORAGE_KEY = 'sanity-test-studio:style-outline'
