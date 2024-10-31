import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useEffect, useState} from 'react'

import {Popover} from '../../../../../ui-components'
import {useColorSchemeValue} from '../../../colorScheme'
import {
  getTrialStage,
  TrialDialogCTAClicked,
  TrialDialogDismissed,
  type TrialDialogDismissedInfo,
  TrialDialogViewed,
} from './__telemetry__/trialDialogEvents.telemetry'
import {DialogContent} from './DialogContent'
import {FreeTrialButtonSidebar, FreeTrialButtonTopbar} from './FreeTrialButton'
import {useFreeTrialContext} from './FreeTrialContext'
import {PopoverContent} from './PopoverContent'

interface FreeTrialProps {
  type: 'sidebar' | 'topbar'
}

export function FreeTrial({type}: FreeTrialProps) {
  const {data, showDialog, showOnLoad, toggleShowContent} = useFreeTrialContext()
  const scheme = useColorSchemeValue()
  const telemetry = useTelemetry()

  // Use callback refs to get the element handle when it's ready/changed
  const [ref, setRef] = useState<HTMLButtonElement | null>(null)

  const [showPopover, setShowPopover] = useState(false)

  useEffect(() => {
    if (ref) {
      // set popover visible when the ref has been set (i.e. the element is ready)
      setShowPopover(true)
    }
  }, [ref])
  const closeAndReOpen = useCallback(() => toggleShowContent(true), [toggleShowContent])
  const toggleDialog = useCallback(() => {
    ref?.focus()
    toggleShowContent(false)
  }, [toggleShowContent, ref])

  const handleClose = useCallback(
    (dialogType?: 'modal' | 'popover') => {
      return (action?: TrialDialogDismissedInfo['dialogDismissAction']) => {
        const dialog = data?.showOnLoad || data?.showOnClick

        if (dialog)
          telemetry.log(TrialDialogDismissed, {
            dialogId: dialog.id,
            dialogRevision: dialog._rev,
            dialogType,
            source: 'studio',
            trialDaysLeft: data.daysLeft,
            dialogTrialStage: getTrialStage({showOnLoad, dialogId: dialog.id}),
            dialogDismissAction: action,
          })

        toggleDialog()
      }
    },
    [data, toggleDialog, showOnLoad, telemetry],
  )

  const handleDialogCTAClick = useCallback(
    (action?: 'openURL' | 'openNext') => {
      return () => {
        const dialog = data?.showOnLoad || data?.showOnClick
        if (dialog)
          telemetry.log(TrialDialogCTAClicked, {
            dialogId: dialog.id,
            dialogRevision: dialog._rev,
            dialogType: 'modal',
            source: 'studio',
            trialDaysLeft: data.daysLeft,
            dialogTrialStage: getTrialStage({showOnLoad, dialogId: dialog.id}),
            dialogCtaType: action === 'openURL' ? 'upgrade' : 'learnMore',
          })
        closeAndReOpen()
      }
    },
    [data, closeAndReOpen, telemetry, showOnLoad],
  )

  const handlePopoverCTAClick = useCallback(() => {
    if (data?.showOnLoad)
      telemetry.log(TrialDialogCTAClicked, {
        dialogId: data.showOnLoad.id,
        dialogRevision: data.showOnLoad._rev,
        dialogType: 'popover',
        source: 'studio',
        trialDaysLeft: data.daysLeft,
        dialogTrialStage: getTrialStage({showOnLoad: true, dialogId: data.showOnLoad.id}),
        dialogCtaType: 'learnMore',
      })
    closeAndReOpen()
  }, [data?.showOnLoad, data?.daysLeft, closeAndReOpen, telemetry])

  const handleOnTrialButtonClick = useCallback(() => {
    if (data?.showOnClick)
      telemetry.log(TrialDialogViewed, {
        dialogId: data.showOnClick.id,
        dialogRevision: data.showOnClick._rev,
        dialogTrigger: 'fromClick',
        dialogType: 'modal',
        source: 'studio',
        trialDaysLeft: data.daysLeft,
        dialogTrialStage: getTrialStage({showOnLoad: true, dialogId: data.showOnClick.id}),
      })
    closeAndReOpen()
  }, [data?.showOnClick, data?.daysLeft, telemetry, closeAndReOpen])

  if (!data?.id) return null
  const dialogToRender = showOnLoad ? data.showOnLoad : data.showOnClick
  if (!dialogToRender) return null

  const button =
    type === 'sidebar' ? (
      <FreeTrialButtonSidebar
        toggleShowContent={handleOnTrialButtonClick}
        daysLeft={data.daysLeft}
        ref={setRef}
      />
    ) : (
      <FreeTrialButtonTopbar
        toggleShowContent={handleOnTrialButtonClick}
        daysLeft={data.daysLeft}
        totalDays={data.totalDays}
        ref={setRef}
      />
    )

  if (dialogToRender?.dialogType === 'popover') {
    return (
      <Popover
        open={showDialog && showPopover}
        size={0}
        scheme={scheme}
        radius={3}
        tone="default"
        portal
        placement={type === 'sidebar' ? 'top' : 'bottom-end'}
        content={
          <PopoverContent
            content={dialogToRender}
            handleClose={handleClose('popover')}
            handleOpenNext={handlePopoverCTAClick}
          />
        }
      >
        {button}
      </Popover>
    )
  }

  return (
    <>
      {button}
      <DialogContent
        content={dialogToRender}
        onClose={handleClose('modal')}
        onOpenNext={handleDialogCTAClick('openNext')}
        onOpenUrlCallback={handleDialogCTAClick('openURL')}
        open={showDialog}
      />
    </>
  )
}
