import {useCallback, useEffect, useState} from 'react'

import {Popover} from '../../../../../ui-components'
import {useColorSchemeValue} from '../../../colorScheme'
import {DialogContent} from './DialogContent'
import {FreeTrialButtonSidebar, FreeTrialButtonTopbar} from './FreeTrialButton'
import {useFreeTrialContext} from './FreeTrialContext'
import {useTelemetry} from '@sanity/telemetry/react'
import {
  TrialDialogCTAClicked,
  TrialDialogDismissed,
  TrialDialogDismissedInfo,
  TrialDialogViewed,
  getTrialStage,
} from './__telemetry__/trialDialogEvents.telemetry'
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

  function handleClose(dialogType?: 'modal' | 'popover') {
    return (action?: TrialDialogDismissedInfo['dialogDismissAction']) => {
      toggleDialog()
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
    }
  }

  const handleDialogCTAClick = useCallback(
    (action?: 'openURL' | 'openNext') => {
      return () => {
        closeAndReOpen()
        const dialog = data?.showOnLoad || data?.showOnClick
        if (dialog)
          telemetry.log(TrialDialogCTAClicked, {
            dialogId: dialog.id,
            dialogRevision: dialog._rev,
            dialogType: 'modal',
            source: 'studio',
            trialDaysLeft: data.daysLeft,
            dialogTrialStage: getTrialStage({showOnLoad, dialogId: dialog.id}),
            dialogCtaType: action === 'openURL' ? 'upgrade' : 'learn_more',
          })
      }
    },
    [data, closeAndReOpen, telemetry, showOnLoad],
  )

  const handlePopoverCTAClick = useCallback(() => {
    closeAndReOpen()
    if (data?.showOnLoad)
      telemetry.log(TrialDialogCTAClicked, {
        dialogId: data.showOnLoad.id,
        dialogRevision: data.showOnLoad._rev,
        dialogType: 'popover',
        source: 'studio',
        trialDaysLeft: data.daysLeft,
        dialogTrialStage: getTrialStage({showOnLoad: true, dialogId: data.showOnLoad.id}),
        dialogCtaType: 'learn_more',
      })
  }, [data, closeAndReOpen, telemetry])

  const handleOnTrialButtonClick = useCallback(() => {
    closeAndReOpen()
    if (data?.showOnClick)
      telemetry.log(TrialDialogViewed, {
        dialogId: data.showOnClick.id,
        dialogRevision: data.showOnClick._rev,
        dialogTrigger: 'from_click',
        dialogType: 'modal',
        source: 'studio',
        trialDaysLeft: data.daysLeft,
        dialogTrialStage: getTrialStage({showOnLoad: true, dialogId: data.showOnClick.id}),
      })
  }, [data, telemetry, closeAndReOpen])

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
        handleClose={handleClose('modal')}
        handleOpenNext={handleDialogCTAClick('openNext')}
        handleOpenUrlCallback={handleDialogCTAClick('openURL')}
        open={showDialog}
      />
    </>
  )
}
