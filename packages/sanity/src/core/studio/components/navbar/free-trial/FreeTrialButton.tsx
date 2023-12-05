import {Popover, Card, Button} from '@sanity/ui'
import {BoltIcon} from '@sanity/icons'
import styled from 'styled-components'

import {useCallback, useEffect, useState} from 'react'
import {useClient} from '../../../../hooks'
import {useColorSchemeValue} from '../../../colorScheme'
import {PopoverContent} from './PopoverContent'

// import {responses} from './responses'
import {DialogContent} from './DialogContent'
import {FreeTrialResponse} from './types'
import {SANITY_VERSION} from '../../../../version'

const StyledButton = styled(Button)`
  padding: 1px;
`
export function FreeTrialButton({data}: {data: FreeTrialResponse}) {
  const schemeValue = useColorSchemeValue()
  // const [data, setData] = useState<FreeTrialDialog | null>(responses[0])
  const [showContent, setShowContent] = useState(false)
  const client = useClient({
    apiVersion: 'vX',
  })

  const fetchData = async () => {
    // TODO: How to get the studio version?
    const response = await client.request({url: `/journey/trial?studioVersion=${SANITY_VERSION}`})
    // setData(response)
    if (response.popover) {
      // sanityStudio:desk:renameDismissed
      if (data.showOnLoad === 'popover') {
        setShowContent(true)
      }
    }
  }

  useEffect(() => {
    // TODO: Validate if the user has seen the "structure rename modal" before showing this one. To avoid multiple popovers at same time.
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleShowContent = useCallback(() => {
    if (showContent) {
      // The user has seen the content, so we can notify the backend.
      // client.request({url: '/journey/trial/', method: 'POST'})
    }
    setShowContent(!showContent)
  }, [showContent])

  if (!data) return null

  const button = (
    <StyledButton
      padding={3}
      fontSize={1}
      mode="bleed"
      onClick={toggleShowContent}
      icon={BoltIcon}
    />
  )

  if (data.popover) {
    return (
      <Card scheme={schemeValue}>
        <Popover
          open={showContent}
          size={0}
          radius={2}
          placement="bottom-end"
          content={<PopoverContent content={data.popover} handleClose={toggleShowContent} />}
        >
          <Card scheme="dark">{button}</Card>
        </Popover>
      </Card>
    )
  }
  if (data.modal) {
    return (
      <>
        {button}
        {showContent && <DialogContent content={data.modal} handleClose={toggleShowContent} />}
      </>
    )
  }
}
