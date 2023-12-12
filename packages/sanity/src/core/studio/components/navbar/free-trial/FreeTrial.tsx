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
  const {data, showDialog, toggleShowContent} = useFreeTrialContext()
  if (!data?.id) return null

  return (
    <Wrapper type={type}>
      {showDialog === 'popover' && data.popover ? (
        <Popover
          open={showDialog === 'popover'}
          size={0}
          radius={2}
          portal
          placement={type === 'mobile' ? 'top-start' : 'bottom-end'}
          content={<PopoverContent content={data.popover} handleClose={toggleShowContent} />}
        >
          <div>
            <FreeTrialButton
              type={type}
              toggleShowContent={toggleShowContent}
              daysLeft={data.daysLeft}
            />
          </div>
        </Popover>
      ) : (
        <FreeTrialButton
          type={type}
          toggleShowContent={toggleShowContent}
          daysLeft={data.daysLeft}
        />
      )}

      {showDialog === 'modal' && data.modal && (
        <DialogContent content={data.modal} handleClose={toggleShowContent} />
      )}
    </Wrapper>
  )
}
