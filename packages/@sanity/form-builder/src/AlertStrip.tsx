import {ErrorOutlineIcon, WarningOutlineIcon, InfoOutlineIcon} from '@sanity/icons'
import {Box, Card, Flex} from '@sanity/ui'
import React, {ComponentProps} from 'react'
import {Details} from './components/Details'

interface AlertProps extends Omit<ComponentProps<typeof Card>, 'title'> {
  title: React.ReactNode
  status?: 'warning' | 'error' | 'info'
  suffix?: React.ReactNode
}

const STATUS_TONES = {
  warning: 'caution',
  error: 'critical',
  info: 'positive',
} as const

const STATUS_ICONS = {
  warning: <WarningOutlineIcon />,
  error: <ErrorOutlineIcon />,
  info: <InfoOutlineIcon />,
}

export function AlertStrip(props: AlertProps) {
  const {children, status = 'warning', suffix, title, ...rest} = props

  return (
    <Card radius={2} tone={STATUS_TONES[status]} {...rest} data-ui="Alert">
      <Flex padding={1}>
        {children && (
          <Box flex={1}>
            <Details icon={STATUS_ICONS[status]} title={title}>
              {children && (
                <Box marginLeft={3} marginTop={3}>
                  {children}
                </Box>
              )}
            </Details>
          </Box>
        )}
      </Flex>
    </Card>
  )
}
