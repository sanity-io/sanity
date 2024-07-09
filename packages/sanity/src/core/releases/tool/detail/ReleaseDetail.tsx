import {ArrowLeftIcon, PublishIcon} from '@sanity/icons'
import {Box, Card, Container, Flex, Heading, Stack, Text} from '@sanity/ui'
import {useMemo, useState} from 'react'
import {LoadingBlock, useClient} from 'sanity'
import {useRouter} from 'sanity/router'

import {Button} from '../../../../ui-components'
import {useListener} from '../../../hooks/useListener'
import {useBundles} from '../../../store/bundles'
import {type BundleDocument} from '../../../store/bundles/types'
import {API_VERSION} from '../../../tasks/constants'
import {BundleMenuButton} from '../../components/BundleMenuButton/BundleMenuButton'
import {type ReleasesRouterState} from '../../types/router'
import {ReleaseOverview} from './ReleaseOverview'

type Screen = 'overview' | 'review'

const useFetchBundleDocuments = (bundleName: string) => {
  const client = useClient({apiVersion: API_VERSION})
  const query = `*[defined(_version) &&  _id in path("${bundleName}.*")]`
  return useListener<BundleDocument>({query, client})
}

export const ReleaseDetail = () => {
  const router = useRouter()
  const [activeScreen, setActiveScreen] = useState<Screen>('overview')
  const {bundleName}: ReleasesRouterState = router.state
  const parsedBundleName = decodeURIComponent(bundleName || '')
  const {data, loading} = useBundles()
  const {documents: bundleDocuments, loading: documentsLoading} =
    useFetchBundleDocuments(parsedBundleName)
  const bundle = data?.find((storeBundle) => storeBundle.name === parsedBundleName)
  const bundleHasDocuments = !!bundleDocuments.length
  const showPublishButton = loading || !bundle?.publishedAt
  const isPublishButtonDisabled = loading || !bundle || !bundleHasDocuments

  const header = useMemo(
    () => (
      <Card flex="none" padding={3}>
        <Flex>
          <Flex align="baseline" flex={1} gap={2}>
            <Flex gap={1}>
              <Button
                as="a"
                // navigate back to bundles overview
                onClick={() => router.navigate({})}
                icon={ArrowLeftIcon}
                mode="bleed"
                tooltipProps={{content: 'Back to releases'}}
              />
              <Box paddingX={1} paddingY={2}>
                <Text as="h1" size={1} weight="semibold">
                  {bundle?.title}
                </Text>
              </Box>
            </Flex>

            <Flex gap={1}>
              <Button
                key="overview"
                mode="bleed"
                onClick={() => setActiveScreen('overview')}
                selected={activeScreen === 'overview'}
                text="Summary"
              />
              {/* StudioButton supports tooltip when button is disabled */}
              <Button
                tooltipProps={{
                  disabled: bundleHasDocuments,
                  content: 'Add documents to this release to review changes',
                  placement: 'bottom',
                }}
                key="review"
                disabled={!bundleHasDocuments}
                mode="bleed"
                onClick={() => setActiveScreen('review')}
                selected={activeScreen === 'review'}
                text="Review changes"
              />
            </Flex>
          </Flex>

          <Flex flex="none" gap={2}>
            {showPublishButton && (
              <Button icon={PublishIcon} disabled={isPublishButtonDisabled} text="Publish all" />
            )}
            <BundleMenuButton bundle={bundle} />
          </Flex>
        </Flex>
      </Card>
    ),
    [activeScreen, bundle, bundleHasDocuments, isPublishButtonDisabled, router, showPublishButton],
  )

  if (loading) {
    return <LoadingBlock title="Loading release" fill data-testid="bundle-documents-table-loader" />
  }

  if (!bundle) {
    return (
      <Card flex={1} tone="critical">
        <Container width={0}>
          <Stack paddingX={4} paddingY={6} space={1}>
            <Heading>Release not found: {bundleName}</Heading>
          </Stack>
        </Container>
      </Card>
    )
  }

  return (
    <Flex direction="column">
      {header}

      <Card flex={1} overflow="auto">
        <Container width={2}>
          <Box paddingX={4} paddingY={6}>
            {documentsLoading ? (
              <LoadingBlock title="Loading documents" />
            ) : (
              <>
                {activeScreen === 'overview' && (
                  <ReleaseOverview documents={bundleDocuments} release={bundle} />
                )}
              </>
            )}
            {/* {activeScreen === 'review' && <ReleaseReview documents={documents} release={release} />} */}
          </Box>
        </Container>
      </Card>
    </Flex>
  )
}
