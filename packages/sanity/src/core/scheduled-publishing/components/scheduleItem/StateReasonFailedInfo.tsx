import {red} from '@sanity/color'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {type CardTone} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {type CSSProperties} from 'react'
import {Text, Container, Flex, Icon} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {SCHEDULE_FAILED_TEXT} from '../../constants'

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

const FAILED_FOREGROUND_STYLE = {
  '--icon-color': red[700].hex,
  '--text-color': red[700].hex,
} as CSSProperties & {'--icon-color': string; '--text-color': string}

const StateReasonFailedInfo = (props: Props) => {
  const {stateReason} = props

  return (
    <MenuButton
      id="stateReason"
      button={
        <Button
          tooltipProps={{content: 'Schedule failed'}}
          mode="bleed"
          data-testid="schedule-validation-list-button"
          icon={ErrorOutlineIcon}
          tone="critical"
        />
      }
      menu={
        <Menu padding={1}>
          <Container padding={2} size={0}>
            <Text size={1} as="div" trim={true}>
              {SCHEDULE_FAILED_TEXT}
            </Text>
            <Flex gap={3} marginTop={4} padding={1}>
              <Icon icon={ErrorOutlineIcon} size={1} style={FAILED_FOREGROUND_STYLE} />
              <Text size={1} style={FAILED_FOREGROUND_STYLE} weight="medium" as="div" trim={true}>
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
