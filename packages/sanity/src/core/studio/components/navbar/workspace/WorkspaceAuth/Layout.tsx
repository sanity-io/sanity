import {SanityLogo} from '@sanity/logos'
import {Box, Card, Flex, Heading, Stack, Text} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {useTranslation} from '../../../../../i18n'

const LINKS = [
  {
    url: 'https://slack.sanity.io/',
    title: 'community',
  },
  {
    url: 'https://www.sanity.io/docs',
    title: 'docs',
  },
  {
    url: 'https://www.sanity.io/legal/privacy',
    title: 'privacy',
  },
  {
    url: 'https://www.sanity.io',
    title: 'sanity-io',
  },
]

const StyledText = styled(Text)`
  a {
    color: inherit;
  }
`

interface LayoutProps {
  header?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}

export function Layout(props: LayoutProps) {
  const {children, footer, header} = props
  const {t} = useTranslation()

  return (
    <Stack space={6}>
      <Card border radius={3} overflow="auto">
        <Stack>
          {typeof header === 'object' && <Box>{header}</Box>}
          {typeof header === 'string' && (
            <Box paddingY={4}>
              <Heading align="center" size={1}>
                {header}
              </Heading>
            </Box>
          )}

          <Box paddingX={1}>
            <Card borderTop={Boolean(header)} borderBottom={Boolean(footer)}>
              {children}
            </Card>
          </Box>

          {footer && <Box>{footer}</Box>}
        </Stack>
      </Card>

      <Flex direction="column" gap={4} justify="center" align="center" paddingBottom={4}>
        <Text size={3}>
          <SanityLogo />
        </Text>

        <Flex align="center" gap={2}>
          {LINKS.map((link, index) => (
            <React.Fragment key={link.title}>
              <StyledText muted size={1}>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  {t(`workspaces.${link.title}-title`)}
                </a>
              </StyledText>

              {index < LINKS.length - 1 && (
                <Text size={1} muted>
                  •
                </Text>
              )}
            </React.Fragment>
          ))}
        </Flex>
      </Flex>
    </Stack>
  )
}
