import {Popover, Card, Button} from '@sanity/ui'
import {BoltIcon} from '@sanity/icons'
import styled from 'styled-components'

import {useCallback, useEffect, useState} from 'react'
import {useClient} from '../../../../hooks'
import {useColorSchemeValue} from '../../../colorScheme'
import {PopoverContent} from './PopoverContent'

import {responses} from './responses'
import {DialogContent} from './DialogContent'
import {FreeTrialDialog} from './types'

const StyledButton = styled(Button)`
  padding: 1px;
`
export function FreeTrialButton({data}: {data: FreeTrialDialog}) {
  const schemeValue = useColorSchemeValue()
  // const [data, setData] = useState<FreeTrialDialog | null>(responses[0])
  const [showContent, setShowContent] = useState(false)
  const client = useClient()

  const fetchData = async () => {
    const response = await client.request({url: '/vX/journey/trial?plan=free'})
    // setData(response)
    if (response.popover) {
      setShowContent(true)
    }
  }
  const notifySeen = async () => {
    // await client.request({url: '/journey/trial/seen', method: 'POST'})
  }

  useEffect(() => {
    // TODO: Validate if the user has seen the "structure rename modal" before showing this one. To avoid multiple popovers at same time.
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleShowContent = useCallback(() => {
    if (showContent) {
      // The user has seen the content, so we can notify the backend.
      notifySeen()
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

  if (data.dialogType === 'popover') {
    return (
      <Card scheme={schemeValue}>
        <Popover
          open={showContent}
          radius={2}
          content={<PopoverContent content={data} handleClose={toggleShowContent} />}
        >
          <Card scheme="dark">{button}</Card>
        </Popover>
      </Card>
    )
  }
  if (data.dialogType === 'modal') {
    return (
      <>
        {button}
        {showContent && <DialogContent content={data} handleClose={toggleShowContent} />}
      </>
    )
  }
}
