import {SanityLogo} from '@sanity/logos'
import {Box, Card, Flex, Heading, Stack, Text, usePrefersDark} from '@sanity/ui'
import {Fragment, type ReactNode} from 'react'

const LINKS = [
  {
    url: 'https://snty.link/community',
    i18nKey: 'workspaces.community-title',
    title: 'Community',
  },
  {
    url: 'https://www.sanity.io/docs',
    i18nKey: 'workspaces.docs-title',
    title: 'Docs',
  },
  {
    url: 'https://www.sanity.io/legal/privacy',
    i18nKey: 'workspaces.privacy-title',
    title: 'Privacy',
  },
  {
    url: 'https://www.sanity.io',
    i18nKey: 'workspaces.sanity-io-title',
    title: 'sanity.io',
  },
]

import {styledText} from './Layout.css'

interface LayoutProps {
  header?: ReactNode
  children: ReactNode
  footer?: ReactNode
}

export function Layout(props: LayoutProps) {
  const {children, footer, header} = props
  const prefersDark = usePrefersDark()

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
          <SanityLogo dark={prefersDark} />
        </Text>

        <Flex align="center" gap={2}>
          {LINKS.map((link, index) => (
            <Fragment key={link.title}>
              <Text className={styledText} muted size={1}>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.title}
                </a>
              </Text>

              {index < LINKS.length - 1 && (
                <Text size={1} muted>
                  •
                </Text>
              )}
            </Fragment>
          ))}
        </Flex>
      </Flex>
    </Stack>
  )
}
