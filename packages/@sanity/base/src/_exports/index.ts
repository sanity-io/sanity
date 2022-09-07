export {default as DefaultRootComponent} from '../components/DefaultRootComponent'
export type {UserStore} from '../datastores/user/types'
export * from '../theme'

// Export document badges typings
export type {DocumentBadgeComponent, DocumentBadgeDescription} from '../badges/types'
export type {OperationsAPI} from '../datastores/document/document-pair/operations'

// Export document actions typings
export type {
  DocumentActionComponent,
  DocumentActionConfirmDialogProps,
  DocumentActionDescription,
  DocumentActionDialogProps,
  DocumentActionModalDialogProps,
  DocumentActionPopoverDialogProps,
  DocumentActionProps,
} from '../actions/utils/types'

export type {SearchOptions, SearchTerms, SearchableType, WeightedHit} from '../search'
