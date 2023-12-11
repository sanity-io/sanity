import {Popover, Card} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {useClient} from '../../../../hooks'
import {useColorSchemeValue} from '../../../colorScheme'
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
  const [showDialog, setShowDialog] = useState<'popover' | 'modal' | null>(null)
  const client = useClient({apiVersion: 'vX'})
  const fetchData = async () => {
    const _response = (await client.request({
      url: `/journey/trial?studioVersion=${SANITY_VERSION}`,
    })) as unknown as FreeTrialResponse | null

    // const response = _response?._type ? _response : responses[0]
    // setData(response)

    setData(_response)
    // Validates if the user has seen the "structure rename modal" before showing this one. To avoid multiple popovers at same time.
    const deskRenameSeen = localStorage.getItem('sanityStudio:desk:renameDismissed') === '1'
    if (deskRenameSeen && _response?.showOnLoad) {
      setShowDialog(_response?.showOnLoad)
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
        if (data?.popover?.id) {
          client.request({url: `/journey/trial/${data.popover.id}`, method: 'POST'})
        }
        break
      case 'modal':
        setShowDialog(null)
        break
      default:
        if (!showDialog && data?.modal?.id) {
          setShowDialog('modal')
        }
        break
    }
  }, [showDialog, client, data?.popover?.id, data?.modal?.id])

  if (!data) return null

  return (
    <Wrapper type={type}>
      {showDialog === 'popover' && data.popover ? (
        <Popover
          open={showDialog === 'popover'}
          size={0}
          radius={2}
          placement={type === 'mobile' ? 'top-start' : 'bottom-end'}
          content={
            <PopoverContent
              daysLeft={data.daysLeft}
              content={data.popover}
              handleClose={toggleShowContent}
            />
          }
        >
          <FreeTrialButton
            type={type}
            toggleShowContent={toggleShowContent}
            daysLeft={data.daysLeft}
          />
        </Popover>
      ) : (
        <FreeTrialButton
          type={type}
          toggleShowContent={toggleShowContent}
          daysLeft={data.daysLeft}
        />
      )}

      {showDialog === 'modal' && data.modal && (
        <DialogContent
          daysLeft={data.daysLeft}
          content={data.modal}
          handleClose={toggleShowContent}
        />
      )}
    </Wrapper>
  )
}
