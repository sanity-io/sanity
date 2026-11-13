import {lazy, useEffect, useMemo} from 'react'
import {preloadObservablePromise, useObservablePromise} from 'react-rx'
import {map} from 'rxjs'
import {VariantsModePromiseContext} from 'sanity/_singletons'
import {route} from 'sanity/router'

import {definePlugin} from '../../config/definePlugin'
import {type ProviderProps} from '../../config/studio/types'
import {FEATURES, useFeatureEnabledObservable} from '../../hooks/useFeatureEnabled'
import {type VariantsMode} from '../contexts/mode/types'
import {VariantsUpsellProvider} from '../contexts/upsell/VariantsUpsellProvider'
import {variantsUsEnglishLocaleBundle} from '../i18n'

const VariantsTool = lazy(() => import('../tool/VariantsTool'))

/**
 * @internal
 */
export const VARIANTS_NAME = 'sanity/variants'

/**
 * @internal
 */
export const VARIANTS_INTENT = 'variant'

const VARIANTS_TOOL_NAME = 'variants'

/**
 * @internal
 */
export const variants = definePlugin({
  name: VARIANTS_NAME,
  studio: {
    components: {
      provider: VariantsStudioProvider,
    },
  },
  tools: [
    {
      name: VARIANTS_TOOL_NAME,
      title: 'Variants',
      component: VariantsTool,
      router: route.create('/', [route.create('/:variantId')]),
      __internalApplicationType: VARIANTS_NAME,
      canHandleIntent: (intent) => intent === VARIANTS_INTENT,
      getIntentState(intent, params) {
        // No id opens the tool root, the variants overview. An id opens that variant.
        if (intent === VARIANTS_INTENT && typeof params.id === 'string') {
          return {variantId: params.id}
        }
        return {}
      },
    },
  ],
  i18n: {
    bundles: [variantsUsEnglishLocaleBundle],
  },
})

// `getDefaultPlugins` only includes this plugin when the workspace has variants enabled, so none of
// its components check `beta.variants.enabled` themselves.
function VariantsStudioProvider(props: ProviderProps) {
  const features$ = useFeatureEnabledObservable(FEATURES.contentVariants)
  // Derived inside the observable, so the context carries the promise that settles in place and
  // `use()` reads it synchronously once it has (a `.then()`-derived promise suspends once more)
  const mode$ = useMemo(
    () =>
      features$.pipe(
        map(({enabled, error}): VariantsMode => {
          if (error) return null
          return enabled ? 'default' : 'upsell'
        }),
      ),
    [features$],
  )
  const modePromise = useObservablePromise(mode$)
  useEffect(() => {
    void preloadObservablePromise(mode$)
  }, [mode$])

  return (
    <VariantsModePromiseContext value={modePromise}>
      <VariantsUpsellProvider>{props.renderDefault(props)}</VariantsUpsellProvider>
    </VariantsModePromiseContext>
  )
}
