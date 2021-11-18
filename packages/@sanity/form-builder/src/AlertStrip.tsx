import {ErrorOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import {Box, Card, Flex} from '@sanity/ui'
import React, {ComponentProps} from 'react'
import {Details} from './components/Details'

interface AlertProps extends Omit<ComponentProps<typeof Card>, 'title'> {
  title: React.ReactNode
  status?: 'warning' | 'error'
  suffix?: React.ReactNode
}

const STATUS_TONES = {
  warning: 'caution',
  error: 'critical',
} as const

export function AlertStrip(props: AlertProps) {
  const {children, status = 'warning', suffix, title, ...rest} = props

  return (
    <Card radius={2} tone={STATUS_TONES[status]} {...rest} data-ui="Alert">
      <Flex padding={1}>
        {children && (
          <Box flex={1}>
            <Details
              icon={status === 'warning' ? <WarningOutlineIcon /> : <ErrorOutlineIcon />}
              title={title}
            >
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
