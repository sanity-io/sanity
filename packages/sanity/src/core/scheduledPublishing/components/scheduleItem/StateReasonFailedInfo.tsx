import {red} from '@sanity/color'
import {ErrorOutlineIcon} from '@sanity/icons'
import {type CardTone, Container, Flex, Menu, Text} from '@sanity/ui'

import {Button, MenuButton} from '../../../../ui-components'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {scheduledPublishingNamespace} from '../../i18n'

interface Props {
  stateReason: string
}

const POPOVER_PROPS = {
  portal: true,
  constrainSize: true,
  preventOverflow: true,
  tone: 'default' as CardTone,
  width: 0,
}

const StateReasonFailedInfo = (props: Props) => {
  const {t} = useTranslation(scheduledPublishingNamespace)
  const {stateReason} = props

  return (
    <MenuButton
      id="stateReason"
      button={
        <Button
          tooltipProps={{content: t('schedule-preview.failed.tooltip')}}
          mode="bleed"
          data-testid="schedule-validation-list-button"
          icon={ErrorOutlineIcon}
          tone="critical"
        />
      }
      menu={
        <Menu padding={1}>
          <Container padding={2} width={0}>
            <Text size={1}>{t('schedule-preview.failed.title')}</Text>
            <Flex gap={3} marginTop={4} padding={1}>
              <Text size={1} style={{color: red[700].hex}}>
                <ErrorOutlineIcon />
              </Text>
              <Text size={1} style={{color: red[700].hex}} weight="medium">
                {stateReason}
              </Text>
            </Flex>
          </Container>
        </Menu>
      }
      popover={POPOVER_PROPS}
    />
  )
}

export default StateReasonFailedInfo
