import {ArrowLeftIcon, PublishIcon} from '@sanity/icons'
import {Box, Card, Container, Flex, Heading, Stack, Text} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {LoadingBlock, useClient} from 'sanity'
import {type RouterContextValue, useRouter} from 'sanity/router'

import {Button} from '../../../../ui-components'
import {useListener} from '../../../hooks/useListener'
import {useBundles} from '../../../store/bundles'
import {API_VERSION} from '../../../tasks/constants'
import {BundleMenuButton} from '../../components/BundleMenuButton/BundleMenuButton'
import {type ReleasesRouterState} from '../../types/router'
import {useReleaseHistory} from './documentTable/useReleaseHistory'
import {ReleaseOverview} from './ReleaseOverview'
import {ReleaseReview} from './ReleaseReview'
import {useBundleDocumentsValidation} from './useBundleDocumentsValidation'

const SUPPORTED_SCREENS = ['overview', 'review'] as const
type Screen = (typeof SUPPORTED_SCREENS)[number]

const useFetchBundleDocuments = (bundleSlug: string) => {
  const client = useClient({apiVersion: API_VERSION})
  const query = `*[defined(_version) &&  _id in path("${bundleSlug}.*")]`
  return useListener({query, client})
}

const getActiveScreen = (router: RouterContextValue): Screen => {
  const activeScreen = Object.fromEntries(router.state._searchParams || []).screen as Screen
  if (
    typeof activeScreen !== 'string' ||
    !activeScreen ||
    !SUPPORTED_SCREENS.includes(activeScreen)
  ) {
    return 'overview'
  }
  return activeScreen
}
export const ReleaseDetail = () => {
  const router = useRouter()

  const activeScreen = getActiveScreen(router)

  const {bundleSlug}: ReleasesRouterState = router.state
  const parsedSlug = decodeURIComponent(bundleSlug || '')
  const {data, loading} = useBundles()
  const {documents: bundleDocuments, loading: documentsLoading} =
    useFetchBundleDocuments(parsedSlug)
  const history = useReleaseHistory(bundleDocuments)

  const bundle = data?.find((storeBundle) => storeBundle.slug === parsedSlug)
  const bundleHasDocuments = !!bundleDocuments.length
  const showPublishButton = loading || !bundle?.publishedAt
  const isPublishButtonDisabled = loading || !bundle || !bundleHasDocuments

  const navigateToReview = useCallback(() => {
    router.navigate({
      ...router.state,
      _searchParams: [['screen', 'review']],
    })
  }, [router])

  const navigateToOverview = useCallback(() => {
    router.navigate({
      ...router.state,
      _searchParams: [],
    })
  }, [router])
  const validations = useBundleDocumentsValidation(bundleDocuments)
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
                onClick={navigateToOverview}
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
                onClick={navigateToReview}
                selected={activeScreen === 'review'}
                text="Review changes"
              />
            </Flex>
          </Flex>

          <Flex flex="none" gap={2}>
            {showPublishButton && (
              <Button icon={PublishIcon} disabled={isPublishButtonDisabled} text="Publish all" />
            )}
            <BundleMenuButton bundle={bundle} documentCount={bundleDocuments.length} />
          </Flex>
        </Flex>
      </Card>
    ),
    [
      activeScreen,
      bundle,
      bundleDocuments.length,
      bundleHasDocuments,
      isPublishButtonDisabled,
      navigateToOverview,
      navigateToReview,
      router,
      showPublishButton,
    ],
  )

  if (loading) {
    return <LoadingBlock title="Loading release" fill data-testid="bundle-documents-table-loader" />
  }

  if (!bundle) {
    return (
      <Card flex={1} tone="critical">
        <Container width={0}>
          <Stack paddingX={4} paddingY={6} space={1}>
            <Heading>Release not found: {bundleSlug}</Heading>
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
                  <ReleaseOverview
                    documents={bundleDocuments}
                    validations={validations}
                    release={bundle}
                    documentsHistory={history.documentsHistory}
                    collaborators={history.collaborators}
                  />
                )}
              </>
            )}
            {activeScreen === 'review' && (
              <ReleaseReview
                documents={bundleDocuments}
                validations={validations}
                release={bundle}
                documentsHistory={history.documentsHistory}
              />
            )}
          </Box>
        </Container>
      </Card>
    </Flex>
  )
}
