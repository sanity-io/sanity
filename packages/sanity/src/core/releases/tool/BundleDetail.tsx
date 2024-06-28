/* eslint-disable @sanity/i18n/no-attribute-string-literals */
/* eslint-disable i18next/no-literal-string */
import {
  ArrowLeftIcon,
  EllipsisHorizontalIcon,
  PublishIcon,
  StarIcon,
  TrashIcon,
} from '@sanity/icons'
import {Box, Button, Card, Flex, Menu, MenuButton, MenuItem, Text} from '@sanity/ui'
import {useState} from 'react'
import {useRouter} from 'sanity/router'

import {Button as StudioButton} from '../../../ui-components'
import {type Version} from '../../versions/types'
import {getRandomToneIcon} from '../../versions/util/dummyGetters'
import {type ReleasesRouterState} from '../types/router'

type Screen = 'overview' | 'review'

const useVersions = (versionId: string): Version => ({
  name: versionId,
  title: versionId,
  ...getRandomToneIcon(),
  publishAt: Date.now() + 1000 * 60 * 60 * 24 * 2,
})

export const BundleDetail = () => {
  const router = useRouter()
  const [activeScreen, setActiveScreen] = useState<Screen>('overview')
  const {bundleId}: ReleasesRouterState = router.state
  const parsed = decodeURIComponent(bundleId || '')

  const bundle = useVersions(parsed)
  const bundleProgress = Math.random()

  return (
    <Flex direction="column">
      <Card flex="none" padding={3}>
        <Flex>
          <Flex align="baseline" flex={1} gap={1}>
            <Button
              as="a"
              // navigate back to bundles overview
              onClick={() => router.navigate({})}
              icon={ArrowLeftIcon}
              mode="bleed"
              padding={2}
            />
            <Box paddingX={1} paddingY={2}>
              <Text as="h1" size={1} weight="semibold">
                {bundle.title}
              </Text>
            </Box>

            <Flex gap={2}>
              <div hidden>
                <Button icon={StarIcon} mode="bleed" padding={2} />
              </div>
              <Flex gap={1}>
                <Button
                  key="overview"
                  mode="bleed"
                  onClick={() => setActiveScreen('overview')}
                  padding={2}
                  selected={activeScreen === 'overview'}
                  text="Overview"
                />
                {/* StudioButton supports tooltip when button is disabled */}
                <StudioButton
                  tooltipProps={{
                    disabled: bundleProgress === 1,
                    content: 'Add documents to this release to review changes',
                    placement: 'bottom',
                  }}
                  key="review"
                  disabled={bundleProgress !== 1}
                  mode="bleed"
                  onClick={() => setActiveScreen('review')}
                  style={{
                    padding: 2,
                  }}
                  selected={activeScreen === 'review'}
                  text="Review"
                />
              </Flex>
            </Flex>
          </Flex>

          <Flex flex="none" gap={2}>
            {/* hide if bundle is already published */}
            {bundle.publishAt && (
              <Button icon={PublishIcon} padding={2} space={2} text="Publish all" />
            )}
            <MenuButton
              button={<Button icon={EllipsisHorizontalIcon} mode="bleed" padding={2} />}
              id="bundle-menu"
              menu={
                <Menu>
                  <MenuItem icon={TrashIcon} text="Delete release" />
                </Menu>
              }
              popover={{
                constrainSize: true,
                fallbackPlacements: [],
                placement: 'bottom',
                portal: true,
              }}
            />
          </Flex>
        </Flex>
      </Card>
    </Flex>
  )
}
