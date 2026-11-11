import {type ReactNode, Suspense, use} from 'react'
import {VariantsUpsellContext} from 'sanity/_singletons'

import {FEATURES, useFeatureEnabled} from '../../../hooks/useFeatureEnabled'
import {type UpsellContextValue, useUpsellContext} from '../../../hooks/useUpsellContext'
import {UpsellContextDialog} from '../../../studio/upsell/UpsellContextDialog'
import {useVariantsMode} from '../mode/useVariantsMode'

/**
 * Mounted in every plan mode by `VariantsStudioProvider`, so the studio never waits for the
 * content variants feature check. The journey content is preloaded only once that check settles
 * as upsell; a plan that has variants never requests it. The UI that opens the dialog already
 * knows it is in upsell mode; the dialog leaf below checks once more.
 *
 * @internal
 */
export function VariantsUpsellProvider(props: {children: ReactNode}) {
  const {enabled, isLoading, error} = useFeatureEnabled(FEATURES.contentVariants)
  const contextValue = useUpsellContext({
    dataUri: '/journey/content-variants',
    feature: 'content-variants',
    preLoadData: !isLoading && !error && !enabled,
  })

  return (
    <VariantsUpsellContext value={contextValue}>
      {props.children}
      <Suspense>
        <VariantsUpsellDialog contextValue={contextValue} />
      </Suspense>
    </VariantsUpsellContext>
  )
}

function VariantsUpsellDialog({contextValue}: {contextValue: UpsellContextValue}) {
  // Only the upsell mode has a dialog to show; a plan with variants, or a failed check, never does
  if (use(useVariantsMode()) !== 'upsell') return null
  return <UpsellContextDialog contextValue={contextValue} />
}
