import {Flex, Stack, Switch, Text} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {useTranslation} from '../../../../../../../../../../i18n'

interface DateIncludeTimeFooterProps {
  onChange: () => void
  value: boolean
}

const TimeLabelText = styled(Text)`
  cursor: default;
`

export function DateIncludeTimeFooter({onChange, value}: DateIncludeTimeFooterProps) {
  const {t} = useTranslation()
  return (
    <Flex align="center" gap={2} justify="flex-end" marginTop={1}>
      <Stack>
        <TimeLabelText muted onClick={onChange} size={1} weight="medium">
          {t('calendar.action.include-time-label')}
        </TimeLabelText>
      </Stack>
      <Switch checked={value} label={t('calendar.action.include-time-label')} onChange={onChange} />
    </Flex>
  )
}
