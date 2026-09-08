import {type BenchDocument} from '../../mock-api/types'
import {createFixtureRng, wordPicker} from './prng'

/**
 * Shared fixture data for the customization scenarios. Lives in
 * a leaf module because BOTH sides import it: the scenarios (node runner)
 * for seeding, and the studio components (vite bundle) for the id list their
 * preview rows render. Keep it free of node- and react-specific imports.
 */

export const PREVIEW_TARGET_COUNT = 20

export const PREVIEW_TARGET_IDS = Array.from(
  {length: PREVIEW_TARGET_COUNT},
  (_, index) => `bench-preview-target-${String(index + 1).padStart(2, '0')}`,
)

/** The paths every preview row observes — module constant on purpose. */
export const PREVIEW_PATHS = ['title', 'subtitle']

export function buildPreviewTargets(): BenchDocument[] {
  const rng = createFixtureRng(19840402)
  const word = wordPicker(rng)
  return PREVIEW_TARGET_IDS.map((id) => ({
    _id: id,
    _type: 'previewTarget',
    title: `${word()} ${word()}`,
    subtitle: `${word()} ${word()} ${word()}`,
  }))
}
