import {Popover} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {useClient} from '../../../../hooks'
import {SANITY_VERSION} from '../../../../version'
import {PopoverContent} from './PopoverContent'
import {DialogContent} from './DialogContent'
import {FreeTrialResponse} from './types'
import {FreeTrialButton} from './FreeTrialButton'
import {responses} from './responses'
import {Wrapper} from './Wrapper'

interface FreeTrialProps {
  type: 'desktop' | 'mobile'
}

export function FreeTrial({type}: FreeTrialProps) {
  const [data, setData] = useState<FreeTrialResponse | null>(null)
  const [showDialog, setShowDialog] = useState<FreeTrialResponse['showOnLoad']>(null)
  const [showingOnLoad, setShowingOnLoad] = useState(false)
  const client = useClient({apiVersion: 'vX'})

  const fetchData = async () => {
    const response = (await client.request({
      url: `/journey/trial?studioVersion=${SANITY_VERSION}`,
    })) as unknown as FreeTrialResponse | null
    // const response = responses[1]
    setData(response)

    // Validates if the user has seen the "structure rename modal" before showing this one. To avoid multiple popovers at same time.
    const deskRenameSeen = localStorage.getItem('sanityStudio:desk:renameDismissed') === '1'
    if (deskRenameSeen && response?.showOnLoad) {
      setShowDialog(response?.showOnLoad)
      setShowingOnLoad(true)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleShowContent = useCallback(() => {
    /**
     * Popover will only be shown if they are request onLoad.
     */
    switch (showDialog) {
      case 'popover':
        setShowDialog(null)
        if (data?.popover?.id && showingOnLoad) {
          client.request({url: `/journey/trial/${data.popover.id}`, method: 'POST'})
        }
        break
      case 'modal':
        setShowDialog(null)
        if (data?.modal?.id && showingOnLoad) {
          client.request({url: `/journey/trial/${data.modal.id}`, method: 'POST'})
        }
        break
      default:
        if (!showDialog && data?.modal?.id) {
          setShowDialog('modal')
        }
        break
    }
  }, [showDialog, client, data?.popover?.id, data?.modal?.id, showingOnLoad])

  if (!data) return null

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
