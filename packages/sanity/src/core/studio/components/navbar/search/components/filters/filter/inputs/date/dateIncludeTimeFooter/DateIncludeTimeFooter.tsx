import {Switch} from '@sanity/ui'
import {Text, Flex, VStack} from 'ui5'

import {useTranslation} from '../../../../../../../../../../i18n/hooks/useTranslation'
import {timeLabelText} from './DateIncludeTimeFooter.css'

interface DateIncludeTimeFooterProps {
  onChange: () => void
  value: boolean
}

export function DateIncludeTimeFooter({onChange, value}: DateIncludeTimeFooterProps) {
  const {t} = useTranslation()
  return (
    <Flex alignItems="center" gap={2} justifyContent="flex-end" marginTop={1}>
      <VStack>
        <Text
          className={timeLabelText}
          muted
          onClick={onChange}
          size={1}
          weight="medium"
          as="div"
          trim={true}
        >
          {t('calendar.action.include-time-label')}
        </Text>
      </VStack>
      <Switch checked={value} label={t('calendar.action.include-time-label')} onChange={onChange} />
    </Flex>
  )
}
