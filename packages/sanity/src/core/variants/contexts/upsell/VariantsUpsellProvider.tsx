import {type ReactNode, Suspense, use} from 'react'
import {VariantsUpsellContext} from 'sanity/_singletons'

import {type UpsellContextValue, useUpsellContext} from '../../../hooks/useUpsellContext'
import {UpsellContextDialog} from '../../../studio/upsell/UpsellContextDialog'
import {useVariantsMode} from '../mode/useVariantsMode'
import {VARIANTS_UPSELL_DATA} from './variantsUpsellData'

/** The journey document for content variants. Not published yet, so the request stays off below. */
const CONTENT_VARIANTS_UPSELL_URI = '/journey/content-variants'

/**
 * Mounted in every plan mode by `VariantsStudioProvider`, so the studio never waits for the
 * content variants feature check. The upsell content is preloaded by `useUpsellContext` and read
 * with `use()` in the dialog and the panel. The request stays disabled until the journey endpoint
 * publishes the content; until then the observable settles with the fixture. The UI that opens the
 * dialog already knows it is in upsell mode; the dialog leaf below checks once more, so a plan
 * that has variants never shows it.
 *
 * @internal
 */
export function VariantsUpsellProvider(props: {children: ReactNode}) {
  const contextValue = useUpsellContext({
    dataUri: CONTENT_VARIANTS_UPSELL_URI,
    feature: 'content-variants',
    enabled: false,
    fallbackData: VARIANTS_UPSELL_DATA,
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
