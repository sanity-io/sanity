import {useTelemetry} from '@sanity/telemetry/react'
import {template} from 'lodash'
import {useCallback, useEffect, useMemo, useState} from 'react'

import {ReleasesUpsellContext} from '../../../../_singletons/context/ReleasesUpsellContext'
import {useClient, useProjectId} from '../../../hooks'
import {useProjectSubscriptions} from '../../../hooks/useProjectSubscriptions'
import {
  UpsellDialogDismissed,
  UpsellDialogLearnMoreCtaClicked,
  UpsellDialogUpgradeCtaClicked,
  UpsellDialogViewed,
} from '../../../studio'
import {type UpsellData} from '../../../studio/upsell/types'
import {UpsellDialog} from '../../../studio/upsell/UpsellDialog'
import {useActiveReleases} from '../../store/useActiveReleases'
import {type ReleasesUpsellContextValue} from './types'

class StudioReleaseLimitExceededError extends Error {
  details: {type: 'releaseLimitExceededError'}

  constructor() {
    super('StudioReleaseLimitExceeded')
    this.name = 'StudioReleaseLimitExceededError'
    this.details = {
      type: 'releaseLimitExceededError',
    }
  }
}

const FEATURE = 'content-releases'
const TEMPLATE_OPTIONS = {interpolate: /{{([\s\S]+?)}}/g}
const BASE_URL = 'www.sanity.io'
// Date when the change from array to object in the data returned was introduced.
const API_VERSION = '2024-04-19'

const FREE_UPSELL = '72a9d606-0f49-45ca-9cf8-e7ed0ba888b7'
const NOT_FREE_UPSELL = 'bb41ee22-4b30-4bc8-81fc-035948a1555a'

const FALLBACK_DIALOG: Pick<
  UpsellData,
  'ctaButton' | 'descriptionText' | 'image' | 'secondaryButton'
> = {
  ctaButton: {
    text: 'Upgrade plan',
    url: 'https://www.sanity.io/manage',
  },
  descriptionText: [
    {
      _key: '35d801e98e2c',
      _type: 'block',
      children: [
        {
          _key: '61915fa6a0d1',
          _type: 'span',
          marks: [],
          text: '',
        },
        {
          _key: '43dd4b01f229',
          _type: 'inlineIcon',
          accent: true,
          sanityIcon: 'add-circle',
        },
        {
          _key: 'c9b0fe28bbea',
          _type: 'span',
          marks: [],
          text: '',
        },
      ],
      markDefs: [],
      style: 'normal',
    },
    {
      _key: 'f2a2e1e9fd8c',
      _type: 'block',
      children: [
        {
          _key: '4882487a1882',
          _type: 'span',
          marks: [],
          text: "You are on the free trial, you can't make releases.",
        },
      ],
      markDefs: [],
      style: 'normal',
    },
    {
      _key: '7a49a331826d',
      _type: 'block',
      children: [
        {
          _key: '5f3a55c1d503',
          _type: 'span',
          marks: [],
          text: "Upgrade to growth to make FALL BACK 'em",
        },
      ],
      markDefs: [],
      style: 'normal',
    },
  ],
  secondaryButton: {
    text: 'Learn more',
    url: 'https://www.sanity.io/docs/comments',
  },
}

/**
 * @beta
 * @hidden
 */
export function ReleasesUpsellProvider(props: {children: React.ReactNode}) {
  const [upsellDialogOpen, setUpsellDialogOpen] = useState(false)
  const [upsellData, setUpsellData] = useState<UpsellData | null>(null)
  const projectId = useProjectId()
  const telemetry = useTelemetry()
  const {projectSubscriptions} = useProjectSubscriptions()
  const client = useClient({apiVersion: API_VERSION})
  const upsellExperienceClient = client.withConfig({projectId: 'pyrmmpch', dataset: 'development'})

  const telemetryLogs = useMemo(
    (): ReleasesUpsellContextValue['telemetryLogs'] => ({
      dialogSecondaryClicked: () =>
        telemetry.log(UpsellDialogLearnMoreCtaClicked, {
          feature: FEATURE,
          type: 'modal',
        }),
      dialogPrimaryClicked: () =>
        telemetry.log(UpsellDialogUpgradeCtaClicked, {
          feature: FEATURE,
          type: 'modal',
        }),
      panelViewed: (source) =>
        telemetry.log(UpsellDialogViewed, {
          feature: FEATURE,
          type: 'inspector',
          source,
        }),
      panelDismissed: () =>
        telemetry.log(UpsellDialogDismissed, {
          feature: FEATURE,
          type: 'inspector',
        }),
      panelPrimaryClicked: () =>
        telemetry.log(UpsellDialogUpgradeCtaClicked, {
          feature: FEATURE,
          type: 'inspector',
        }),
      panelSecondaryClicked: () =>
        telemetry.log(UpsellDialogLearnMoreCtaClicked, {
          feature: FEATURE,
          type: 'inspector',
        }),
    }),
    [telemetry],
  )

  const handlePrimaryButtonClick = useCallback(() => {
    telemetryLogs.dialogPrimaryClicked()
  }, [telemetryLogs])

  const handleSecondaryButtonClick = useCallback(() => {
    telemetryLogs.dialogSecondaryClicked()
  }, [telemetryLogs])

  const handleClose = useCallback(() => {
    setUpsellDialogOpen(false)
    telemetry.log(UpsellDialogDismissed, {
      feature: FEATURE,
      type: 'modal',
    })
  }, [telemetry])

  useEffect(() => {
    const data$ = upsellExperienceClient.observable.getDocument(
      // optionally check the status as 'trialling' to restrict free trials to NOT_FREE_UPSELL
      projectSubscriptions?.plan.planTypeId === 'free' ? FREE_UPSELL : NOT_FREE_UPSELL,
    )

    // const data$ = throwError(() => new Error('Simulated error for testing'))

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
        const data = FALLBACK_DIALOG
        setUpsellData(data)
      },
    })

    return () => {
      sub.unsubscribe()
    }
  }, [client, projectId, projectSubscriptions?.plan.planTypeId, upsellExperienceClient.observable])

  const handleOpenDialog = useCallback(() => {
    setUpsellDialogOpen(true)

    telemetry.log(UpsellDialogViewed, {
      feature: FEATURE,
      type: 'modal',
      source: 'navbar',
    })
  }, [telemetry])

  const [releaseLimit, setReleaseLimit] = useState<number | undefined>(undefined)
  const {data: activeReleases} = useActiveReleases()

  const execIfNotUpsell = useCallback(
    async (cb: () => void, throwError: boolean = false) => {
      const isAllowedToCreate =
        releaseLimit === undefined || releaseLimit > (activeReleases?.length || 0)

      if (isAllowedToCreate) {
        return cb()
      }

      handleOpenDialog()
      if (throwError) {
        throw new StudioReleaseLimitExceededError()
      }
      return false
    },
    [activeReleases?.length, handleOpenDialog, releaseLimit],
  )

  const setUpsellLimit = useCallback(
    (limit: number) => {
      setReleaseLimit(limit)

      if ((activeReleases?.length || 0) >= limit) {
        handleOpenDialog()
      }
    },
    [activeReleases?.length, handleOpenDialog],
  )

  const ctxValue = useMemo<ReleasesUpsellContextValue>(
    () => ({
      upsellDialogOpen,
      handleOpenDialog,
      execIfNotUpsell,
      setUpsellLimit,
      upsellData,
      telemetryLogs,
    }),
    [
      upsellDialogOpen,
      handleOpenDialog,
      execIfNotUpsell,
      setUpsellLimit,
      upsellData,
      telemetryLogs,
    ],
  )

  return (
    <ReleasesUpsellContext.Provider value={ctxValue}>
      {props.children}
      {upsellData && upsellDialogOpen && (
        <UpsellDialog
          data={upsellData}
          onClose={handleClose}
          onPrimaryClick={handlePrimaryButtonClick}
          onSecondaryClick={handleSecondaryButtonClick}
        />
      )}
    </ReleasesUpsellContext.Provider>
  )
}
