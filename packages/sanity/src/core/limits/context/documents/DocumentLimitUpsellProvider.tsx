import {template} from 'lodash'
import {type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {DocumentLimitUpsellContext} from 'sanity/_singletons'

import {useClient, useProjectId} from '../../../hooks'
import {TEMPLATE_OPTIONS} from '../../../studio/upsell/constants'
import {type UpsellData} from '../../../studio/upsell/types'
import {UpsellDialog} from '../../../studio/upsell/UpsellDialog'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'
import {type DocumentLimitUpsellContextValue} from './types'

// TODO: use www.sanity.io once personalization-forge is updated
const BASE_URL = 'www.sanity.work'

export function DocumentLimitUpsellProvider({children}: PropsWithChildren) {
  const [upsellDialogOpen, setUpsellDialogOpen] = useState(false)
  const [upsellData, setUpsellData] = useState<UpsellData | null>(null)
  const projectId = useProjectId()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  // TODO: Add telemetry
  const telemetryLogs = useMemo<DocumentLimitUpsellContextValue['telemetryLogs']>(
    () => ({
      dialogPrimaryClicked: () => {
        // console.log('Primary Clicked')
      },
      dialogSecondaryClicked: () => {
        // console.log('Secondary Clicked')
      },
    }),
    [],
  )

  const handleOpenDialog = useCallback(() => {
    setUpsellDialogOpen(true)
    // console.log('Dialog Open')
  }, [])

  const handleClose = useCallback(() => {
    setUpsellDialogOpen(false)
    // console.log('Dialog Closed')
  }, [])

  const handlePrimaryButtonClick = useCallback(() => {
    telemetryLogs.dialogPrimaryClicked()
  }, [telemetryLogs])

  const handleSecondaryButtonClick = useCallback(() => {
    telemetryLogs.dialogSecondaryClicked()
  }, [telemetryLogs])

  // This could probably be in a hook for all upsell dialogs
  useEffect(() => {
    const data$ = client.observable.request<UpsellData | null>({
      uri: '/journey/document-limit',
    })

    const sub = data$.subscribe({
      next: (data) => {
        if (!data) return
        try {
          const ctaUrl = template(data.ctaButton.url, TEMPLATE_OPTIONS)
          data.ctaButton.url = ctaUrl({baseUrl: BASE_URL, projectId})

          const secondaryUrl = template(data.secondaryButton.url, TEMPLATE_OPTIONS)
          data.secondaryButton.url = secondaryUrl({baseUrl: BASE_URL, projectId})
          setUpsellData(data)
        } catch (e) {
          // silently fail
        }
      },
      error: () => {
        // silently fail
      },
    })

    return () => {
      sub.unsubscribe()
    }
  }, [client, projectId])

  const ctxValue = useMemo<DocumentLimitUpsellContextValue>(
    () => ({
      upsellDialogOpen,
      handleOpenDialog,
      upsellData,
      telemetryLogs,
    }),
    [handleOpenDialog, upsellDialogOpen, upsellData, telemetryLogs],
  )

  return (
    <DocumentLimitUpsellContext.Provider value={ctxValue}>
      {children}
      {upsellData && upsellDialogOpen && (
        <UpsellDialog
          data={upsellData}
          onClose={handleClose}
          onPrimaryClick={handlePrimaryButtonClick}
          onSecondaryClick={handleSecondaryButtonClick}
        />
      )}
    </DocumentLimitUpsellContext.Provider>
  )
}

export const useDocumentLimitsUpsellContext = () => {
  const value = useContext(DocumentLimitUpsellContext)

  if (!value) {
    return {
      upsellData: null,
      handleOpenDialog: () => null,
      upsellDialogOpen: false,
      telemetryLogs: {
        dialogSecondaryClicked: () => null,
      },
    }
  }

  return value
}
