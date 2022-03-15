export {useDocumentPresence, useGlobalPresence} from '../datastores/presence/hooks'
export {useUser, useCurrentUser} from '../datastores/user/hooks'
export {useDocumentType} from '../datastores/document/hooks'
/* eslint-disable camelcase */
export {
  unstable_useDocumentPairPermissions,
  unstable_useDocumentValuePermissions,
  unstable_useTemplatePermissions,
} from '../datastores/grants'
/* eslint-enable camelcase */
export {useUserColor} from '../user-color/hooks'
export {useTimeAgo} from '../time/useTimeAgo'
export {useDocumentValues} from '../datastores/document/useDocumentValues'
export {useModuleStatus} from '../module-status'
// eslint-disable-next-line camelcase
export {unstable_useConditionalProperty} from '../conditional-property'

// These hooks used to be exported from `@sanity/react-hooks`
export * from './useConnectionState'
export * from './useDocumentOperation'
export * from './useDocumentOperationEvent'
export * from './useEditState'
export * from './useSyncState'
export * from './useValidationStatus'
