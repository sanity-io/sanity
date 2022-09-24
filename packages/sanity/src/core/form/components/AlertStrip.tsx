import {ErrorOutlineIcon, WarningOutlineIcon, InfoOutlineIcon} from '@sanity/icons'
import {Box, Card, CardProps, Flex} from '@sanity/ui'
import React from 'react'
import {Details} from './Details'

interface AlertProps extends Omit<CardProps, 'title'> {
  title: React.ReactNode
  status?: 'warning' | 'error' | 'info'
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

export function AlertStrip(props: AlertProps & Omit<React.HTMLProps<HTMLDivElement>, 'ref'>) {
  const {children, status = 'warning', title, ...rest} = props

  return (
    <Card radius={2} tone={STATUS_TONES[status]} {...rest} data-ui="Alert">
      <Flex padding={1}>
        {children && (
          <Box flex={1}>
            <Details icon={STATUS_ICONS[status]} title={title}>
              <Box marginLeft={3} marginTop={3}>
                {children}
              </Box>
            </Details>
          </Box>
        )}
      </Flex>
    </Card>
  )
}
