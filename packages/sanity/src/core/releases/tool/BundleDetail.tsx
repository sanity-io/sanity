import {type SanityDocument} from '@sanity/client'
import {ArrowLeftIcon, PublishIcon, StarIcon} from '@sanity/icons'
import {Box, Button, Card, Container, Flex, Text} from '@sanity/ui'
import {useMemo, useState} from 'react'
import {LoadingBlock} from 'sanity'
import {useRouter} from 'sanity/router'

import {Button as StudioButton} from '../../../ui-components'
import {useBundles} from '../../store/bundles'
import {BundleMenuButton} from '../components/BundleMenuButton/BundleMenuButton'
import {type ReleasesRouterState} from '../types/router'
import BundlesReview from './review/BundlesReview'

type Screen = 'overview' | 'review'

export const BundleDetail = () => {
  const router = useRouter()
  const [activeScreen, setActiveScreen] = useState<Screen>('overview')
  const {bundleId}: ReleasesRouterState = router.state
  const parsedBundleId = decodeURIComponent(bundleId || '')
  const {data, loading} = useBundles()
  const bundleDocuments: SanityDocument[] = [
    {
      _version: {},
      _createdAt: '2024-07-09T12:15:17Z',
      coverImage: {
        _type: 'image',
        asset: {
          _ref: 'image-6b2b1b90ba1163346fca6f80cd348cdf55a4d816-3040x1586-png',
          _type: 'reference',
        },
      },
      _rev: '8Zk2lZBQdowXkfNP5kOQHV',
      _type: 'book',
      _id: 'rita-release.b39ed729-4041-40bd-be1c-e7d6297ea7b9',
      title: 'Rita Document 1',
      _updatedAt: '2024-07-09T12:15:17Z',
    },
  ] // TODO get real data
  const bundle = data?.find((storeBundle) => storeBundle._id === parsedBundleId)
  const bundleHasDocuments = !!bundleDocuments.length
  const showPublishButton = loading || !bundle?.publishedAt
  const isPublishButtonDisabled = loading || !bundle || !bundleHasDocuments

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
                    disabled: bundleHasDocuments,
                    content: 'Add documents to this release to review changes',
                    placement: 'bottom',
                  }}
                  key="review"
                  disabled={!bundleHasDocuments}
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
            {showPublishButton && (
              <Button
                icon={PublishIcon}
                padding={2}
                space={2}
                disabled={isPublishButtonDisabled}
                text="Publish all"
              />
            )}
            <BundleMenuButton bundle={bundle} />
          </Flex>
        </Flex>
      </Card>
    ),
    [activeScreen, bundle, bundleHasDocuments, isPublishButtonDisabled, router, showPublishButton],
  )

  return (
    <Flex direction="column">
      {header}
      {loading && <LoadingBlock fill data-testid="bundle-documents-table-loader" />}

      <Card flex={1} overflow="auto">
        <Container width={2}>
          <Box paddingX={4} paddingY={6}>
            {activeScreen === 'review' && (
              <BundlesReview documents={bundleDocuments} bundle={bundle} />
            )}
          </Box>
        </Container>
      </Card>
    </Flex>
  )
}
