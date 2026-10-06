import {Suspense, useContext} from 'react'
import {
  SingleDocReleaseUpsellContext,
  type SingleDocReleaseUpsellContextValue,
} from 'sanity/_singletons'

import {useUpsellContext} from '../../hooks/useUpsellContext'
import {SETTLED_WITHOUT_UPSELL_DATA} from '../../hooks/useUpsellData'
import {UpsellContextDialog} from '../../studio/upsell/UpsellContextDialog'

/**
 * @beta
 */
export function SingleDocReleaseUpsellProvider(props: {children: React.ReactNode}) {
  const contextValue = useUpsellContext({
    dataUri: '/journey/scheduled-drafts',
    feature: 'single_doc_release',
  })

  return (
    <SingleDocReleaseUpsellContext.Provider value={contextValue}>
      {props.children}
      <Suspense>
        <UpsellContextDialog contextValue={contextValue} />
      </Suspense>
    </SingleDocReleaseUpsellContext.Provider>
  )
}

export function useSingleDocReleaseUpsell(): SingleDocReleaseUpsellContextValue {
  // Rendered outside the provider (the releases tool without the plugin), consumers get an inert
  // value: the dialog can't open and there is no data.
  return useContext(SingleDocReleaseUpsellContext) ?? FALLBACK_CONTEXT_VALUE
}

const FALLBACK_CONTEXT_VALUE = {
  upsellDataPromise: SETTLED_WITHOUT_UPSELL_DATA,
  handleOpenDialog: () => null,
  handleClose: () => null,
  upsellDialogOpen: false,
  telemetryLogs: {
    dialogSecondaryClicked: () => null,
    dialogPrimaryClicked: () => null,
    panelViewed: () => null,
    panelDismissed: () => null,
    panelPrimaryClicked: () => null,
    panelSecondaryClicked: () => null,
  },
} satisfies SingleDocReleaseUpsellContextValue
