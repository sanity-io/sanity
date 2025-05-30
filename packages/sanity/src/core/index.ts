export * from './changeIndicators'
export * from './comments'
export * from './components'
export * from './components/collapseMenu'
export * from './components/scroll'
export * from './config'
export * from './create'
export * from './environment'
export * from './field'
export * from './FIXME'
export * from './form'
export * from './hooks'
export * from './i18n'
export {ReleasesNav} from './perspective/navbar/ReleasesNav'
export {PerspectiveProvider} from './perspective/PerspectiveProvider'
export {
  type PerspectiveContextValue,
  type PerspectiveStack,
  type ReleaseId,
  type ReleasesNavMenuItemPropsGetter,
  type SelectedPerspective,
} from './perspective/types'
export {useExcludedPerspective} from './perspective/useExcludedPerspective'
export {usePerspective} from './perspective/usePerspective'
export {useSetPerspective} from './perspective/useSetPerspective'
export * from './presence'
export * from './preview'
export {
  formatRelativeLocalePublishDate,
  getReleaseIdFromReleaseDocumentId,
  getReleaseTone,
  getVersionInlineBadge,
  isDraftPerspective,
  isGoingToUnpublish,
  isPublishedPerspective,
  isReleaseDocument,
  isReleasePerspective,
  isReleaseScheduledOrScheduling,
  LATEST,
  ReleaseAvatar,
  RELEASES_INTENT,
  RELEASES_STUDIO_CLIENT_OPTIONS,
  useActiveReleases,
  useArchivedReleases,
  useDocumentVersionInfo,
  useDocumentVersions,
  useDocumentVersionTypeSortedList,
  useIsReleaseActive,
  useOnlyHasVersions,
  useReleasesIds,
  useVersionOperations,
  VersionChip,
  type VersionInfoDocumentStub,
  VersionInlineBadge,
} from './releases'
export * from './scheduledPublishing'
export * from './schema'
export type {SearchFactoryOptions, SearchOptions, SearchSort, SearchTerms} from './search'
export {createSearch, getSearchableTypes, isPerspectiveRaw} from './search'
export * from './store'
export * from './studio'
export {DEFAULT_STUDIO_CLIENT_OPTIONS} from './studioClient'
export {IsLastPaneProvider} from './tasks'
export * from './templates'
export * from './theme'
export * from './user-color'
export * from './util'
export {
  Rule as ConcreteRuleClass,
  validateDocument,
  type ValidateDocumentOptions,
} from './validation'
export * from './version'
export {type ReleaseDocument} from '@sanity/client'

// If moved at the top it creates a circular dependency issue where `useClient` is not found when running tests
// eslint-disable-next-line simple-import-sort/exports
export {useCanvasCompanionDoc} from './canvas/actions/useCanvasCompanionDoc'
export {useNavigateToCanvasDoc} from './canvas/useNavigateToCanvasDoc'
