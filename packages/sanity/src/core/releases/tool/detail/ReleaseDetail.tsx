import {ArrowLeftIcon} from '@sanity/icons'
import {Box, Card, Container, Flex, Heading, Stack, Text} from '@sanity/ui'
import {useCallback, useEffect, useMemo} from 'react'
import {LoadingBlock} from 'sanity'
import {type RouterContextValue, useRouter} from 'sanity/router'

import {Button} from '../../../../ui-components'
import {useLiveDocumentSet} from '../../../preview/useLiveDocumentSet'
import {useBundles} from '../../../store/bundles'
import {BundleMenuButton} from '../../components/BundleMenuButton/BundleMenuButton'
import {ReleasePublishAllButton} from '../../components/ReleasePublishAllButton/ReleasePublishAllButton'
import {type ReleasesRouterState} from '../../types/router'
import {useReleaseHistory} from './documentTable/useReleaseHistory'
import {ReleaseReview} from './ReleaseReview'
import {ReleaseSummary} from './ReleaseSummary'
import {useBundleDocumentsValidation} from './useBundleDocumentsValidation'

const SUPPORTED_SCREENS = ['summary', 'review'] as const
type Screen = (typeof SUPPORTED_SCREENS)[number]

const getActiveScreen = (router: RouterContextValue): Screen => {
  const activeScreen = Object.fromEntries(router.state._searchParams || []).screen as Screen
  if (
    typeof activeScreen !== 'string' ||
    !activeScreen ||
    !SUPPORTED_SCREENS.includes(activeScreen)
  ) {
    return 'summary'
  }
  return activeScreen
}
export const ReleaseDetail = () => {
  const router = useRouter()

  const activeScreen = getActiveScreen(router)

  const {bundleSlug}: ReleasesRouterState = router.state
  const parsedSlug = decodeURIComponent(bundleSlug || '')
  const {data, loading} = useBundles()
  const {documents: bundleDocuments, loading: documentsLoading} = useLiveDocumentSet(
    `defined(_version) &&  _id in path("${parsedSlug}.*")`,
  )

  const history = useReleaseHistory(bundleDocuments)
  const validation = useBundleDocumentsValidation(bundleDocuments)

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

  const navigateToSummary = useCallback(() => {
    router.navigate({
      ...router.state,
      _searchParams: [],
    })
  }, [router])

  // review screen will not be available once published
  // so redirect to summary screen
  useEffect(() => {
    if (activeScreen === 'review' && bundle?.publishedAt) {
      navigateToSummary()
    }
  }, [activeScreen, bundle?.publishedAt, navigateToSummary])

  const header = useMemo(
    () => (
      <Card
        flex="none"
        padding={3}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'var(--card-bg-color)',
        }}
      >
        <Flex>
          <Flex align="baseline" flex={1} gap={2}>
            <Flex gap={1}>
              <Button
                as="a"
                // navigate back to bundles overview
                onClick={() => router.navigate({})}
                data-testid="back-to-releases-button"
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
                key="summary"
                mode="bleed"
                onClick={navigateToSummary}
                selected={activeScreen === 'summary'}
                text="Summary"
              />
              {/* StudioButton supports tooltip when button is disabled */}
              {!bundle?.publishedAt && (
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
              )}
            </Flex>
          </Flex>

          <Flex flex="none" gap={2}>
            {showPublishButton && bundle && (
              <ReleasePublishAllButton
                bundle={bundle}
                bundleDocuments={bundleDocuments}
                disabled={isPublishButtonDisabled}
                validation={validation}
              />
            )}
            <BundleMenuButton bundle={bundle} documentCount={bundleDocuments.length} />
          </Flex>
        </Flex>
      </Card>
    ),
    [
      activeScreen,
      bundle,
      bundleDocuments,
      bundleHasDocuments,
      isPublishButtonDisabled,
      navigateToReview,
      navigateToSummary,
      router,
      showPublishButton,
      validation,
    ],
  )

  const detailContent = useMemo(() => {
    if (!bundle) return null

    if (activeScreen === 'summary') {
      return (
        <ReleaseSummary
          documents={bundleDocuments}
          release={bundle}
          documentsHistory={history.documentsHistory}
          collaborators={history.collaborators}
          validation={validation}
        />
      )
    }
    if (activeScreen === 'review') {
      return (
        <ReleaseReview
          documents={bundleDocuments}
          release={bundle}
          documentsHistory={history.documentsHistory}
          validation={validation}
        />
      )
    }
    return null
  }, [
    activeScreen,
    bundle,
    bundleDocuments,
    history.collaborators,
    history.documentsHistory,
    validation,
  ])

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
            {documentsLoading ? <LoadingBlock title="Loading documents" /> : detailContent}
          </Box>
        </Container>
      </Card>
    </Flex>
  )
}
