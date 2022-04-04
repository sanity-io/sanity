export {useDocumentPresence, useGlobalPresence} from '../datastores'
export {useUser, useCurrentUser} from '../datastores'
export {useDocumentType} from '../datastores'
export {useUserColor} from '../user-color'
export {useDocumentValues} from '../datastores'
export {useModuleStatus} from '../module-status'
// eslint-disable-next-line camelcase
export {unstable_useConditionalProperty} from '../conditional-property'

// These hooks used to be exported from `@sanity/react-hooks`
export * from './useTimeAgo'
export * from './useConnectionState'
export * from './useDocumentOperation'
export * from './useDocumentOperationEvent'
export * from './useEditState'
export * from './useSyncState'
export * from './useValidationStatus'
