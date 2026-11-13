import {Card, Text} from '@sanity/ui'
import {type ReactNode} from 'react'
import {Box, Flex, VStack} from 'ui5'

import {BreadcrumbItemContent, SeparatorItem} from '../DialogBreadcrumbs'
import {breadcrumbItem} from '../DialogBreadcrumbs.css'

function CrumbRow({children}: {children: ReactNode}) {
  return <Flex alignItems="center">{children}</Flex>
}

function Crumb({children}: {children: ReactNode}) {
  return (
    <Box className={breadcrumbItem} minWidth="0">
      {children}
    </Box>
  )
}

/**
 * Chromatic sentinel for dialog and presentation breadcrumb crumbs after the
 * ui5 Box / Flex / Text migration. Muted vs selected weight, optional `#n`
 * Badge, capitalize, truncation, and the `/` separator all sit in one Flex
 * row — a mix TypeScript will not catch. Fixture titles only; no form
 * dialog, no preview fetch.
 */
export function DialogBreadcrumbsStory() {
  return (
    <Card padding={4} style={{maxWidth: 480}}>
      <VStack gap={5}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            unselected then selected
          </Text>
          <CrumbRow>
            <Crumb>
              <BreadcrumbItemContent title="animals" />
            </Crumb>
            <SeparatorItem>/</SeparatorItem>
            <Crumb>
              <BreadcrumbItemContent isSelected title="blue whale" />
            </Crumb>
          </CrumbRow>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            index badge
          </Text>
          <CrumbRow>
            <Crumb>
              <BreadcrumbItemContent index={2} title="friends" />
            </Crumb>
            <SeparatorItem>/</SeparatorItem>
            <Crumb>
              <BreadcrumbItemContent index={1} isSelected title="dolphin" />
            </Crumb>
          </CrumbRow>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            capitalize off
          </Text>
          <CrumbRow>
            <Crumb>
              <BreadcrumbItemContent capitalize={false} title="Posts" />
            </Crumb>
            <SeparatorItem>/</SeparatorItem>
            <Crumb>
              <BreadcrumbItemContent capitalize={false} isSelected title="iPhone teaser" />
            </Crumb>
          </CrumbRow>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            truncated
          </Text>
          <CrumbRow>
            <Crumb>
              <BreadcrumbItemContent title="A very long nested object title that should ellipsize inside the crumb" />
            </Crumb>
            <SeparatorItem>/</SeparatorItem>
            <Crumb>
              <BreadcrumbItemContent isSelected title="current" />
            </Crumb>
          </CrumbRow>
        </VStack>
      </VStack>
    </Card>
  )
}
