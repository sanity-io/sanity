import {Flex, Stack, Switch, Text} from '@sanity/ui'

import {useTranslation} from '../../../../../../../../../../i18n'

import {timeLabelText} from './DateIncludeTimeFooter.css'

interface DateIncludeTimeFooterProps {
  onChange: () => void
  value: boolean
}

export function DateIncludeTimeFooter({onChange, value}: DateIncludeTimeFooterProps) {
  const {t} = useTranslation()
  return (
    <Flex align="center" gap={2} justify="flex-end" marginTop={1}>
      <Stack>
        <Text className={timeLabelText} muted onClick={onChange} size={1} weight="medium">
          {t('calendar.action.include-time-label')}
        </Text>
      </Stack>
      <Switch checked={value} label={t('calendar.action.include-time-label')} onChange={onChange} />
    </Flex>
  )
}
