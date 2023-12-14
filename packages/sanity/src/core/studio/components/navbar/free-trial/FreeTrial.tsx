import {useCallback, useEffect, useState} from 'react'
import {Popover} from '@sanity/ui'
import {PopoverContent} from './PopoverContent'
import {DialogContent} from './DialogContent'
import {FreeTrialButton} from './FreeTrialButton'
import {Wrapper} from './Wrapper'
import {useFreeTrialContext} from './FreeTrialContext'

interface FreeTrialProps {
  type: 'desktop' | 'mobile'
}

export function FreeTrial({type}: FreeTrialProps) {
  const {data, showDialog, showOnLoad, toggleShowContent} = useFreeTrialContext()
  //  On mobile, give it some time so the popover doesn't show up until the navbar is open.
  const [showPopover, setShowPopover] = useState(type !== 'mobile')

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPopover(true)
    }, 300)

    return () => {
      clearTimeout(timer)
    }
  }, [])

  const closeAndReOpen = useCallback(() => toggleShowContent(true), [toggleShowContent])
  const toggleDialog = useCallback(() => toggleShowContent(false), [toggleShowContent])

  if (!data?.id) return null
  const dialogToRender = showOnLoad ? data.showOnLoad : data.showOnClick
  if (!dialogToRender) return null

  if (dialogToRender?.dialogType === 'popover') {
    return (
      <Wrapper type={type}>
        <Popover
          open={showDialog && showPopover}
          size={0}
          radius={2}
          portal
          placement={type === 'mobile' ? 'top' : 'bottom-end'}
          content={
            <PopoverContent
              content={dialogToRender}
              handleClose={toggleDialog}
              handleOpenNext={closeAndReOpen}
            />
          }
        >
          <div>
            <FreeTrialButton
              type={type}
              toggleShowContent={closeAndReOpen}
              daysLeft={data.daysLeft}
              trialDays={data.trialDays}
            />
          </div>
        </Popover>
      </Wrapper>
    )
  }

  return (
    <Wrapper type={type}>
      <FreeTrialButton
        type={type}
        toggleShowContent={closeAndReOpen}
        daysLeft={data.daysLeft}
        trialDays={data.trialDays}
      />
      <DialogContent
        content={dialogToRender}
        handleClose={toggleDialog}
        handleOpenNext={closeAndReOpen}
        open={showDialog}
      />
    </Wrapper>
  )
}
