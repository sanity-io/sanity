import {ArrowLeftIcon} from '@sanity/icons'
import {Box, Card, Container, Flex, Heading, Stack, Text} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useRef} from 'react'
import {LoadingBlock} from 'sanity'
import {type RouterContextValue, useRouter} from 'sanity/router'

import {Button} from '../../../../ui-components'
import {Translate, useTranslation} from '../../../i18n'
import {useBundles} from '../../../store/bundles'
import {BundleMenuButton} from '../../components/BundleMenuButton/BundleMenuButton'
import {ReleasePublishAllButton} from '../../components/ReleasePublishAllButton/ReleasePublishAllButton'
import {releasesLocaleNamespace} from '../../i18n'
import {type ReleasesRouterState} from '../../types/router'
import {useReleaseHistory} from './documentTable/useReleaseHistory'
import {ReleaseReview} from './ReleaseReview'
import {ReleaseSummary} from './ReleaseSummary'
import {useBundleDocuments} from './useBundleDocuments'

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
  const {data, loading, deletedBundles} = useBundles()
  const deletedBundle = deletedBundles[parsedSlug]

  const {loading: documentsLoading, results} = useBundleDocuments(parsedSlug)

  const documentIds = results.map((result) => result.document?._id)
  const history = useReleaseHistory(documentIds)

  const bundle = data?.find((storeBundle) => storeBundle.slug === parsedSlug)
  const bundleHasDocuments = !!results.length
  const showPublishButton = loading || !bundle?.publishedAt
  const isPublishButtonDisabled = loading || !bundle || !bundleHasDocuments

  const {t} = useTranslation(releasesLocaleNamespace)

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

  const header = useMemo(() => {
    const headerBundle = bundle || deletedBundle
    const isBundleDeleted = !!deletedBundle

    return (
      <Card flex="none" padding={3}>
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
                  {headerBundle?.title}
                </Text>
              </Box>
            </Flex>

            <Flex gap={1}>
              <Button
                key="summary"
                mode="bleed"
                onClick={navigateToSummary}
                selected={activeScreen === 'summary'}
                text={t('actions.summary')}
                data-testid="summary-button"
              />
              {/* StudioButton supports tooltip when button is disabled */}
              {!headerBundle?.publishedAt && (
                <Button
                  tooltipProps={{
                    disabled: bundleHasDocuments || isBundleDeleted,
                    content: t('review.description'),
                    placement: 'bottom',
                  }}
                  key="review"
                  disabled={!bundleHasDocuments || isBundleDeleted}
                  mode="bleed"
                  onClick={navigateToReview}
                  selected={activeScreen === 'review'}
                  text={t('action.review')}
                  data-testid="review-button"
                />
              )}
            </Flex>
          </Flex>

          <Flex flex="none" gap={2}>
            {!isBundleDeleted && showPublishButton && bundle && (
              <ReleasePublishAllButton
                bundle={bundle}
                bundleDocuments={results}
                disabled={isPublishButtonDisabled}
              />
            )}
            <BundleMenuButton
              disabled={isBundleDeleted}
              bundle={headerBundle}
              documentCount={results.length}
            />
          </Flex>
        </Flex>
      </Card>
    )
  }, [
    activeScreen,
    bundle,
    bundleHasDocuments,
    deletedBundle,
    isPublishButtonDisabled,
    navigateToReview,
    navigateToSummary,
    results,
    router,
    showPublishButton,
    t,
  ])

  const scrollContainerRef = useRef(null)

  const detailContent = useMemo(() => {
    if (deletedBundle) {
      return (
        <Card flex={1} tone="critical">
          <Container width={0}>
            <Stack paddingY={4} space={1}>
              <Heading>
                <Translate t={t} i18nKey="deleted-release" values={{title: deletedBundle.title}} />
              </Heading>
            </Stack>
          </Container>
        </Card>
      )
    }
    if (!bundle) return null

    if (activeScreen === 'summary') {
      return (
        <ReleaseSummary
          documents={results}
          release={bundle}
          documentsHistory={history.documentsHistory}
          collaborators={history.collaborators}
          scrollContainerRef={scrollContainerRef}
        />
      )
    }
    if (activeScreen === 'review') {
      return (
        <ReleaseReview
          documents={results}
          release={bundle}
          documentsHistory={history.documentsHistory}
          scrollContainerRef={scrollContainerRef}
        />
      )
    }
    return null
  }, [
    activeScreen,
    bundle,
    deletedBundle,
    history.collaborators,
    history.documentsHistory,
    results,
    t,
  ])

  if (loading) {
    return (
      <LoadingBlock title={t('loading-release')} fill data-testid="bundle-documents-table-loader" />
    )
  }

  if (!bundle && !deletedBundle) {
    return (
      <Card flex={1} tone="critical">
        <Container width={0}>
          <Stack paddingX={4} paddingY={6} space={1}>
            <Heading>{t('not-found', {bundleSlug})}</Heading>
          </Stack>
        </Container>
      </Card>
    )
  }

  return (
    <Flex direction="column" height="fill">
      {header}
      <Flex paddingX={4} ref={scrollContainerRef} overflow="auto">
        <Container width={2} paddingX={2}>
          {documentsLoading ? <LoadingBlock title={t('document-loading')} /> : detailContent}
        </Container>
      </Flex>
    </Flex>
  )
}
