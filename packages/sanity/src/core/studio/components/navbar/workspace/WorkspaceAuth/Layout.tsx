import {SanityLogo} from '@sanity/logos'
import {Card, Heading, usePrefersDark} from '@sanity/ui'
import {Fragment, type ReactNode} from 'react'
import {Text, Box, Flex, VStack, Icon, Link} from 'ui5'

import {footerLink} from './Layout.css'

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

interface LayoutProps {
  header?: ReactNode
  children: ReactNode
  footer?: ReactNode
}

export function Layout(props: LayoutProps) {
  const {children, footer, header} = props
  const prefersDark = usePrefersDark()

  return (
    <VStack gap={6}>
      <Card border radius={3} overflow="auto">
        <VStack>
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
        </VStack>
      </Card>

      <Flex
        flexDirection="column"
        gap={4}
        justifyContent="center"
        alignItems="center"
        paddingBottom={4}
      >
        <Icon size={3} icon={<SanityLogo dark={prefersDark} />} style={{margin: '-0.5rem'}} />

        <Flex alignItems="center" gap={2}>
          {LINKS.map((link, index) => (
            <Fragment key={link.title}>
              <Text muted size={1} as="div" trim={true}>
                <Link className={footerLink} href={link.url} openInNewTab underlined={false}>
                  {link.title}
                </Link>
              </Text>

              {index < LINKS.length - 1 && (
                <Text size={1} muted as="div" trim={true}>
                  •
                </Text>
              )}
            </Fragment>
          ))}
        </Flex>
      </Flex>
    </VStack>
  )
}
