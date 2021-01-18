import {ErrorOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import {Box, Card, Flex, Text, ThemeColorToneKey} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'

interface AlertProps {
  children?: React.ReactNode
  title: React.ReactNode
  status?: 'warning' | 'error'
  suffix?: React.ReactNode
}

const STATUS_TONES: {[key: string]: ThemeColorToneKey} = {
  warning: 'caution',
  error: 'critical',
}

const SuffixBox = styled(Box)`
  border-top: 1px solid var(--card-border-color);
`

export function Alert(props: AlertProps) {
  const {children, status = 'warning', suffix, title} = props

  return (
    <Card radius={2} tone={STATUS_TONES[status]}>
      <Flex padding={4}>
        <Box>
          <Text size={1}>
            {status === 'warning' && <WarningOutlineIcon />}
            {status === 'error' && <ErrorOutlineIcon />}
          </Text>
        </Box>

        <Box flex={1} marginLeft={3}>
          <Text size={1} weight="semibold">
            {title}
          </Text>

          {children && <Box marginTop={3}>{children}</Box>}
        </Box>
      </Flex>

      {suffix && <SuffixBox>{suffix}</SuffixBox>}
    </Card>
  )
}
