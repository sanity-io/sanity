/* eslint-disable @sanity/i18n/no-attribute-string-literals */
/* eslint-disable i18next/no-literal-string */
import {
  ArrowLeftIcon,
  CheckmarkCircleIcon,
  CheckmarkIcon,
  EllipsisHorizontalIcon,
  PublishIcon,
  StarIcon,
  TrashIcon,
} from '@sanity/icons'
import {Box, Button, Card, Flex, Menu, MenuButton, MenuItem, Text} from '@sanity/ui'
import {useState} from 'react'
import {useRouter} from 'sanity/router'

import {Button as StudioButton} from '../../../ui-components'
import {getRandomToneIcon, type Version} from '../../util/versions/util'
import {ProgressIcon} from '../components/progressIcon/ProgressIcon'
import {type ReleasesRouterState} from '../types/router'

type Screen = 'overview' | 'review'

const useVersions = (versionId: string): Version => ({
  name: versionId,
  title: versionId,
  ...getRandomToneIcon(),
  publishAt: Date.now() + 1000 * 60 * 60 * 24 * 2,
})

export const ReleaseDetail = () => {
  const router = useRouter()
  const [activeScreen, setActiveScreen] = useState<Screen>('overview')
  const {releaseId}: ReleasesRouterState = router.state
  const parsed = decodeURIComponent(releaseId || '')

  const release = useVersions(parsed)
  const releaseProgress = Math.random()

  return (
    <Flex direction="column">
      <Card flex="none" padding={3}>
        <Flex>
          <Flex align="baseline" flex={1} gap={1}>
            <Button
              as="a"
              // navigate back to releases overview
              onClick={() => router.navigate({})}
              icon={ArrowLeftIcon}
              mode="bleed"
              padding={2}
            />
            <Box paddingX={1} paddingY={2}>
              <Text as="h1" size={1} weight="semibold">
                {release.title}
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
                    disabled: releaseProgress === 1,
                    content: 'Add documents to this release to review changes',
                    placement: 'bottom',
                  }}
                  key="review"
                  disabled={releaseProgress !== 1}
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
            {/* TODO: render progress and publish only if there are documents in release */}
            <Flex flex="none" gap={2} padding={2}>
              {releaseProgress < 1 ? (
                <Text size={1}>
                  <ProgressIcon
                    progress={releaseProgress}
                    style={{color: 'var(--card-badge-caution-icon-color)'}}
                  />
                </Text>
              ) : (
                <Text muted size={1}>
                  <CheckmarkCircleIcon style={{color: 'var(--card-badge-positive-icon-color)'}} />
                </Text>
              )}
              <Text muted size={1}>
                {releaseProgress < 1 ? `${(releaseProgress * 100).toFixed(0)}%` : 'Ready'}
              </Text>
            </Flex>

            <Button
              icon={release.publishAt ? CheckmarkIcon : PublishIcon}
              padding={2}
              space={2}
              text={release.publishAt ? 'Mark all as ready' : 'Publish all'}
            />
            <MenuButton
              button={<Button icon={EllipsisHorizontalIcon} mode="bleed" padding={2} />}
              id="release-menu"
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
