import {Box, Flex, Stack} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'

import {Button} from '../../../ui-components'
import {Popover} from '../../../ui-components/popover'
import {useTranslation} from '../../i18n'

interface HintPopoverProps {
  localStorageKey: string
  content: string | React.ReactElement
  children: React.ReactElement
}

export function HintPopover(props: HintPopoverProps) {
  const {localStorageKey, content, children} = props
  const [isOpen, setIsOpen] = useState(false)
  const {t} = useTranslation()

  useEffect(() => {
    // Check localStorage to see if user has dismissed this hint before
    const isDismissed = localStorage.getItem(localStorageKey) !== null
    setIsOpen(!isDismissed)
  }, [localStorageKey])

  const handleDismiss = useCallback(() => {
    localStorage.setItem(localStorageKey, '')
    setIsOpen(false)
  }, [localStorageKey])

  const popoverContent = (
    <Box padding={3}>
      <Stack space={2}>
        {content}
        <Flex justify="flex-end" paddingTop={2}>
          <Button
            // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
            text="Got it!"
            onClick={handleDismiss}
            tooltipProps={{content: t('announcement.floating-button.dismiss')}}
          />
        </Flex>
      </Stack>
    </Box>
  )

  return (
    <Popover content={popoverContent} open={isOpen} portal arrow>
      {children}
    </Popover>
  )
}
