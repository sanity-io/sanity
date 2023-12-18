import {useCallback, useEffect, useRef, useState} from 'react'
import {Popover} from '../../../../../ui'
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
  //  On mobile, give it some time so the popover doesn't show up until the navbar is open.
  const [showPopover, setShowPopover] = useState(type !== 'sidebar')
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPopover(true)
    }, 300)

    return () => {
      clearTimeout(timer)
    }
  }, [])

  const closeAndReOpen = useCallback(() => toggleShowContent(true), [toggleShowContent])
  const toggleDialog = useCallback(() => {
    ref.current?.focus()
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
        ref={ref}
      />
    ) : (
      <FreeTrialButtonTopbar
        toggleShowContent={closeAndReOpen}
        daysLeft={data.daysLeft}
        totalDays={data.totalDays}
        ref={ref}
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
