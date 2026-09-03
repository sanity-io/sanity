import {Stack, Switch, Text} from '@sanity/ui'
import {styled} from 'styled-components'
import {Flex} from 'ui5'

import {useTranslation} from '../../../../../../../../../../i18n/hooks/useTranslation'

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
    <Flex alignItems="center" gap={2} justifyContent="flex-end" marginTop={1}>
      <Stack>
        <TimeLabelText muted onClick={onChange} size={1} weight="medium">
          {t('calendar.action.include-time-label')}
        </TimeLabelText>
      </Stack>
      <Switch checked={value} label={t('calendar.action.include-time-label')} onChange={onChange} />
    </Flex>
  )
}
