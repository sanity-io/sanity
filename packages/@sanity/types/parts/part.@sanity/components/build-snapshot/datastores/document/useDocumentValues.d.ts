import {LoadableState} from '../../util/useLoadable'
export declare function useDocumentValues<T = Record<string, unknown>>(
  documentId: string | undefined,
  paths: string[]
): LoadableState<T>
