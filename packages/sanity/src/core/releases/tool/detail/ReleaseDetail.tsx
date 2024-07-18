import {ArrowLeftIcon, ErrorOutlineIcon, PublishIcon} from '@sanity/icons'
import {Box, Card, Container, Flex, Heading, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {LoadingBlock, useClient} from 'sanity'
import {type RouterContextValue, useRouter} from 'sanity/router'

import {Button} from '../../../../ui-components'
import {useListener} from '../../../hooks/useListener'
import {useBundles} from '../../../store/bundles'
import {useBundleOperations} from '../../../store/bundles/useBundleOperations'
import {API_VERSION} from '../../../tasks/constants'
import {BundleMenuButton} from '../../components/BundleMenuButton/BundleMenuButton'
import {type ReleasesRouterState} from '../../types/router'
import {useReleaseHistory} from './documentTable/useReleaseHistory'
import {ReleaseReview} from './ReleaseReview'
import {ReleaseSummary} from './ReleaseSummary'
import {useBundleDocumentsValidation} from './useBundleDocumentsValidation'

const SUPPORTED_SCREENS = ['summary', 'review'] as const
type Screen = (typeof SUPPORTED_SCREENS)[number]

const useFetchBundleDocuments = (bundleSlug: string) => {
  const client = useClient({apiVersion: API_VERSION})
  const query = `*[defined(_version) && _id in path("${bundleSlug}.*")]`
  return useListener({query, client})
}

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
  const {publishBundle} = useBundleOperations()
  const {documents: bundleDocuments, loading: documentsLoading} =
    useFetchBundleDocuments(parsedSlug)
  const [isPublishingBundle, setIsPublishingBundle] = useState(false)
  const history = useReleaseHistory(bundleDocuments)
  const validation = useBundleDocumentsValidation(bundleDocuments)

  const bundle = data?.find((storeBundle) => storeBundle.slug === parsedSlug)
  const bundleHasDocuments = !!bundleDocuments.length
  const showPublishButton = loading || !bundle?.publishedAt
  const isValidatingDocuments = Object.values(validation).some(({isValidating}) => isValidating)
  const hasDocumentValidationErrors = Object.values(validation).some(({hasError}) => hasError)
  const isPublishButtonDisabled =
    loading || !bundle || !bundleHasDocuments || isPublishingBundle || hasDocumentValidationErrors

  const toast = useToast()

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

  const publishTooltipContent = useMemo(() => {
    if (!hasDocumentValidationErrors && !isValidatingDocuments) return null

    const tooltipText = () => {
      if (isValidatingDocuments) {
        return 'Validating documents...'
      }

      if (hasDocumentValidationErrors) {
        return 'Some documents have validation errors'
      }

      return null
    }

    return (
      <Flex gap={1} align="center">
        <ErrorOutlineIcon />
        <Text muted size={1}>
          {tooltipText()}
        </Text>
      </Flex>
    )
  }, [hasDocumentValidationErrors, isValidatingDocuments])

  const handlePublishAll = useCallback(async () => {
    if (!bundle) return

    try {
      setIsPublishingBundle(true)
      await publishBundle(bundle._id, bundleDocuments)
      toast.push({
        closable: true,
        status: 'success',
        title: (
          <Text muted size={1}>
            The <strong>{bundle.title}</strong> release was published
          </Text>
        ),
      })
    } catch (publishingError) {
      toast.push({
        status: 'error',
        title: (
          <Text muted size={1}>
            Failed to publish the <strong>{bundle.title}</strong> release
          </Text>
        ),
      })
    } finally {
      setIsPublishingBundle(false)
    }
  }, [bundle, bundleDocuments, publishBundle, toast])

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
              <Button
                tooltipProps={{
                  disabled: !isPublishButtonDisabled && !isValidatingDocuments,
                  content: publishTooltipContent,
                  placement: 'bottom',
                }}
                icon={PublishIcon}
                disabled={isPublishButtonDisabled}
                text="Publish all"
                onClick={handlePublishAll}
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
      bundleDocuments.length,
      bundleHasDocuments,
      handlePublishAll,
      isPublishButtonDisabled,
      isValidatingDocuments,
      navigateToReview,
      navigateToSummary,
      publishTooltipContent,
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
                {activeScreen === 'summary' && (
                  <ReleaseSummary
                    documents={bundleDocuments}
                    release={bundle}
                    documentsHistory={history.documentsHistory}
                    collaborators={history.collaborators}
                    validation={validation}
                  />
                )}
              </>
            )}
            {activeScreen === 'review' && (
              <ReleaseReview
                documents={bundleDocuments}
                release={bundle}
                documentsHistory={history.documentsHistory}
                validation={validation}
              />
            )}
          </Box>
        </Container>
      </Card>
    </Flex>
  )
}
