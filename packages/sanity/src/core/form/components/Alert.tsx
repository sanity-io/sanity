import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Card} from '@sanity/ui'
import {type ComponentProps, type ReactNode} from 'react'
import {Text, Flex, Box, type TextProps, Icon, type IconProps} from 'ui5'

import {suffixBox} from './Alert.css'

interface AlertProps extends Omit<ComponentProps<typeof Card>, 'title'> {
  title: ReactNode
  status?: 'warning' | 'error'
  suffix?: ReactNode
}

const STATUS_TONES = {
  warning: 'caution',
  error: 'critical',
} as const

export function Alert(props: AlertProps) {
  const {children, status = 'warning', suffix, title, ...rest} = props

  return (
    <Card
      radius={2}
      tone={STATUS_TONES[status]}
      {...rest}
      data-ui="Alert"
      data-testid={`alert-${status}`}
    >
      <Flex padding={4}>
        <Box>
          <Icon
            size={1}
            muted
            icon={status === 'warning' ? WarningOutlineIcon : ErrorOutlineIcon}
            tone={STATUS_TONES[status] as IconProps['tone']}
            style={{margin: '-0.375rem'}}
          />
        </Box>

        <Box flexBasis="0%" flexGrow={1} marginLeft={3}>
          <Text
            size={1}
            weight="medium"
            as="div"
            trim={true}
            tone={STATUS_TONES[status] as TextProps['tone']}
          >
            {title}
          </Text>

          {children && <Box marginTop={3}>{children}</Box>}
        </Box>
      </Flex>

      {suffix && <Box className={suffixBox}>{suffix}</Box>}
    </Card>
  )
}
