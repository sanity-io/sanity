import {useState, useMemo, useEffect, useCallback} from 'react'
import {ClientConfig} from '@sanity/client'
import {useTelemetry} from '@sanity/telemetry/react'
import {set, template} from 'lodash'
import {CommentsUpsellData} from '../../types'
import {CommentsUpsellDialog} from '../../components'
import {
  CommentsUpsellDialogPrimaryBtnClicked,
  CommentsUpsellDialogSecondaryBtnClicked,
  CommentsUpsellPanelPrimaryBtnClicked,
  CommentsUpsellPanelSecondaryBtnClicked,
} from '../../../__telemetry__/comments.telemetry'
import {CommentsUpsellContext} from './CommentsUpsellContext'
import {CommentsUpsellContextValue} from './types'
import {useClient, DEFAULT_STUDIO_CLIENT_OPTIONS, useWorkspace} from 'sanity'

const QUERY = `*[_type == "upsellUI" && id == "comments-upsell"][0]{
    ...,
   image {
       asset-> { url, altText }
     },
     descriptionText[]{
       ...,
       _type == "iconAndText" => {
         ...,
         icon {
           "url": asset->.url
         }
       },
       _type == "block" => {
         ...,
           children[] {
             ...,
             _type == "inlineIcon" => {
               icon {"url": asset->.url}
             }
         }
       }
     }
 }`

const UPSELL_CLIENT: Partial<ClientConfig> = {
  dataset: 'upsell-public-production',
  projectId: 'pyrmmpch',
  withCredentials: false,
  useCdn: true,
}

const TEMPLATE_OPTIONS = {interpolate: /{{([\s\S]+?)}}/g}
/**
 * @beta
 * @hidden
 */
export function CommentsUpsellProvider(props: {children: React.ReactNode}) {
  const [upsellDialogOpen, setUpsellDialogOpen] = useState(false)
  const [upsellData, setUpsellData] = useState<CommentsUpsellData | null>(null)
  const {projectId} = useWorkspace()
  const telemetry = useTelemetry()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const telemetryLogs = useMemo(
    (): CommentsUpsellContextValue['telemetryLogs'] => ({
      dialogSecondaryClicked: () => telemetry.log(CommentsUpsellDialogPrimaryBtnClicked),
      dialogPrimaryClicked: () => telemetry.log(CommentsUpsellDialogSecondaryBtnClicked),
      panelPrimaryClicked: () => telemetry.log(CommentsUpsellPanelPrimaryBtnClicked),
      panelSecondaryClicked: () => telemetry.log(CommentsUpsellPanelSecondaryBtnClicked),
    }),
    [telemetry],
  )

  const handlePrimaryButtonClick = useCallback(() => {
    telemetryLogs.dialogPrimaryClicked()
  }, [telemetryLogs])

  const handleSecondaryButtonClick = useCallback(() => {
    telemetryLogs.dialogSecondaryClicked()
  }, [telemetryLogs])

  const handleClose = useCallback(() => setUpsellDialogOpen(false), [])

  useEffect(() => {
    const data$ = client
      .withConfig(UPSELL_CLIENT)
      .observable.fetch<CommentsUpsellData | null>(QUERY)

    const sub = data$.subscribe((data) => {
      if (!data) return
      try {
        const ctaUrl = template(data.ctaButton.url, TEMPLATE_OPTIONS)
        data.ctaButton.url = ctaUrl({baseUrl: 'sanity.io', projectId})

        const secondaryUrl = template(data.secondaryButton.url, TEMPLATE_OPTIONS)
        data.secondaryButton.url = secondaryUrl({baseUrl: 'sanity.io', projectId})
        setUpsellData(data)
      } catch (e) {
        // silently fail
      }
    })

    return () => {
      sub.unsubscribe()
    }
  }, [client, projectId])

  const ctxValue = useMemo<CommentsUpsellContextValue>(
    () => ({
      upsellDialogOpen,
      setUpsellDialogOpen,
      upsellData,
      telemetryLogs,
    }),
    [upsellDialogOpen, setUpsellDialogOpen, upsellData, telemetryLogs],
  )

  return (
    <CommentsUpsellContext.Provider value={ctxValue}>
      {props.children}
      {upsellData && upsellDialogOpen && (
        <CommentsUpsellDialog
          data={upsellData}
          onClose={handleClose}
          onPrimaryClick={handlePrimaryButtonClick}
          onSecondaryClick={handleSecondaryButtonClick}
        />
      )}
    </CommentsUpsellContext.Provider>
  )
}
