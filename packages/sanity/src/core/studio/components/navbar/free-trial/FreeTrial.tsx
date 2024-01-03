import {useCallback, useEffect, useRef, useState} from 'react'
import {Popover} from '../../../../../ui-components'
import {useColorSchemeValue} from '../../../colorScheme'
import {PopoverContent} from './PopoverContent'
import {DialogContent} from './DialogContent'
import {FreeTrialButtonTopbar, FreeTrialButtonSidebar} from './FreeTrialButton'
import {useFreeTrialContext} from './FreeTrialContext'

interface FreeTrialProps {
  type: 'sidebar' | 'topbar'
}

export function FreeTrial({type}: FreeTrialProps) {
  const {data, showDialog, showOnLoad, toggleShowContent} = useFreeTrialContext()
  const scheme = useColorSchemeValue()

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

  if (!data?.id) return null
  const dialogToRender = showOnLoad ? data.showOnLoad : data.showOnClick
  if (!dialogToRender) return null

  const button =
    type === 'sidebar' ? (
      <FreeTrialButtonSidebar
        toggleShowContent={closeAndReOpen}
        daysLeft={data.daysLeft}
        ref={setRef}
      />
    ) : (
      <FreeTrialButtonTopbar
        toggleShowContent={closeAndReOpen}
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
            handleClose={toggleDialog}
            handleOpenNext={closeAndReOpen}
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
        handleClose={toggleDialog}
        handleOpenNext={closeAndReOpen}
        open={showDialog}
      />
    </>
  )
}
