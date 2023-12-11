import {Popover, Card} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {useClient} from '../../../../hooks'
import {useColorSchemeValue} from '../../../colorScheme'
import {SANITY_VERSION} from '../../../../version'
import {PopoverContent} from './PopoverContent'
import {DialogContent} from './DialogContent'
import {FreeTrialResponse} from './types'
import {FreeTrialButton} from './FreeTrialButton'

export function FreeTrial() {
  const schemeValue = useColorSchemeValue()
  const [data, setData] = useState<FreeTrialResponse | null>(null)
  const [showContent, setShowContent] = useState(false)
  const client = useClient({apiVersion: 'vX'})
  // TODO: This maybe changes and we are going to return only one option in the response.
  const dialogId = data?.popover?.id || data?.modal?.id
  const fetchData = async () => {
    const response = await client.request({url: `/journey/trial?studioVersion=${SANITY_VERSION}`})
    setData(response)

    // Validates if the user has seen the "structure rename modal" before showing this one. To avoid multiple popovers at same time.
    const deskRenameSeen = localStorage.getItem('sanityStudio:desk:renameDismissed') === '1'
    if (response.showOnLoad && deskRenameSeen && response.popover) {
      setShowContent(true)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleShowContent = useCallback(() => {
    if (showContent && dialogId) {
      // The user has seen the content, so we can notify the backend.
      client.request({url: `/journey/trial/${dialogId}`, method: 'POST'})
    }
    setShowContent(!showContent)
  }, [showContent, client, dialogId])

  if (!data) return null

  if (data.popover) {
    return (
      <Card scheme={schemeValue}>
        <Popover
          open={showContent}
          size={0}
          radius={2}
          placement="bottom-end"
          content={
            <PopoverContent
              daysLeft={data.daysLeft}
              content={data.popover}
              handleClose={toggleShowContent}
            />
          }
        >
          <Card scheme="dark">
            <FreeTrialButton toggleShowContent={toggleShowContent} daysLeft={data.daysLeft} />
          </Card>
        </Popover>
      </Card>
    )
  }
  if (data.modal) {
    return (
      <>
        <FreeTrialButton toggleShowContent={toggleShowContent} daysLeft={data.daysLeft} />
        {showContent && (
          <DialogContent
            daysLeft={data.daysLeft}
            content={data.modal}
            handleClose={toggleShowContent}
          />
        )}
      </>
    )
  }
}
