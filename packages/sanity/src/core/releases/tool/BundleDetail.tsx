/* eslint-disable @sanity/i18n/no-attribute-string-literals */
/* eslint-disable i18next/no-literal-string */
import {ArrowLeftIcon, PublishIcon, StarIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Text} from '@sanity/ui'
import {useMemo, useState} from 'react'
import {LoadingBlock} from 'sanity'
import {useRouter} from 'sanity/router'

import {Button as StudioButton} from '../../../ui-components'
import {useBundlesStore} from '../../store/bundles'
import {BundleMenuButton} from '../components/BundleMenuButton/bundleMenuButton'
import {type ReleasesRouterState} from '../types/router'

type Screen = 'overview' | 'review'

export const BundleDetail = () => {
  const router = useRouter()
  const [activeScreen, setActiveScreen] = useState<Screen>('overview')
  const {bundleId}: ReleasesRouterState = router.state
  const parsedBundleId = decodeURIComponent(bundleId || '')
  const {data, loading} = useBundlesStore()

  const bundle = data?.find((storeBundle) => storeBundle._id === parsedBundleId)

  const header = useMemo(
    () => (
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
                {bundle?.title}
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
                    // hide tooltip if documents in bundle
                    content: 'Add documents to this release to review changes',
                    placement: 'bottom',
                  }}
                  key="review"
                  // disable review if no documents in bundle
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
            <Button
              icon={PublishIcon}
              padding={2}
              space={2}
              disabled={!bundle}
              text="Publish all"
            />
            <BundleMenuButton bundle={bundle} />
          </Flex>
        </Flex>
      </Card>
    ),
    [activeScreen, bundle, router],
  )

  return (
    <Flex direction="column">
      {header}
      {loading && <LoadingBlock fill />}
    </Flex>
  )
}
