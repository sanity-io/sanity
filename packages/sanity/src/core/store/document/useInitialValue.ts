import {type InitialValueResolverContext, type SanityDocumentLike} from '@sanity/types'
import {useToast} from '@sanity/ui'
import {useMemo} from 'react'
import {useObservable as useSyncObservable} from 'react-rx'
import {map, startWith, tap} from 'rxjs/operators'

import {useDataset} from '../../hooks/useDataset'
import {useProjectId} from '../../hooks/useProjectId'
import {useSchema} from '../../hooks/useSchema'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {classifyRequestError} from '../../studio/requestErrors/classify'
import {useStudioErrorHandler} from '../../studio/requestErrors/useStudioErrorHandler'
import {useSource} from '../../studio/source'
import {getVersionId} from '../../util/draftUtils'
import {useUnique} from '../../util/useUnique'
import {useDocumentStore} from '../datastores'
import {useCurrentUser} from '../user/hooks'
import {type InitialValueState} from './initialValue/types'

/**
 * @internal
 */
export function useInitialValue(props: {
  documentId: string
  documentType: string
  templateName?: string
  templateParams?: Record<string, unknown>
  version?: string
}): InitialValueState {
  const {documentId, documentType, templateName, templateParams: templateParamsRaw, version} = props
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const templateParams = useUnique(templateParamsRaw)
  const documentStore = useDocumentStore()
  const context = useInitialValueResolverContext()
  const errorHandler = useStudioErrorHandler()
  const toast = useToast()
  const {t} = useTranslation()

  const defaultValue: SanityDocumentLike = useMemo(
    () => ({
      _id: version ? getVersionId(documentId, version) : documentId,
      _type: documentType,
    }),
    [documentId, documentType, version],
  )

  const loadingState: InitialValueState = useMemo(
    () => ({loading: true, error: null, value: defaultValue}),
    [defaultValue],
  )

  const idleState: InitialValueState = useMemo(
    () => ({loading: false, error: null, value: defaultValue}),
    [defaultValue],
  )

  const state$ = useMemo(() => {
    const initialValueOptions = {documentId, documentType, templateName, templateParams}

    return documentStore.initialValue(initialValueOptions, context).pipe(
      tap((msg) => {
        if (msg.type !== 'error') return

        const pushErrorToast = () =>
          toast.push({
            id: `initial-value-error-${documentId}`,
            status: 'error',
            title: t('document.initial-value.error.title'),
            description: t('document.initial-value.error.description', {
              errorMessage: msg.error.message,
            }),
          })

        // The document opens with the empty default value either way; how we
        // surface the failure depends on its kind:
        //  - Infrastructure errors (network down, 5xx, rate limited) from a
        //    resolver's `client.fetch` go to the studio's request-error
        //    dialog (with retry) — the dialog is the surface, no toast.
        //  - Everything else (resolver bugs, validation, 404s) gets a toast
        //    so the failure isn't silent.
        if (classifyRequestError(msg.error)) {
          // `handle` rejects when no handler claims the error — e.g. the
          // passthrough handler used when there's no WorkspacesProvider (an
          // embedded/standalone render). Fall back to the toast so a
          // classifiable-but-unhandled infra error is never fully silent.
          void errorHandler.handle(msg.error).catch(pushErrorToast)
        } else {
          pushErrorToast()
        }
      }),
      map((msg): InitialValueState => {
        if (msg.type === 'loading') {
          return loadingState
        }

        if (msg.type === 'success') {
          return {
            loading: false,
            error: null,
            value: msg.value ? {...defaultValue, ...msg.value} : defaultValue,
          }
        }

        if (msg.type === 'error') {
          return {loading: false, error: msg.error, value: defaultValue}
        }

        return idleState
      }),
      startWith(loadingState),
    )
  }, [
    defaultValue,
    documentId,
    documentStore,
    documentType,
    templateName,
    templateParams,
    context,
    errorHandler,
    toast,
    t,
    loadingState,
    idleState,
  ])

  // Seeded with loadingState to match the stream's synchronous
  // startWith(loadingState) first emission.
  return useSyncObservable(state$, loadingState)
}

/**
 * @internal
 */
export function useInitialValueResolverContext(): InitialValueResolverContext {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const source = useSource()
  const schema = useSchema()
  const currentUser = useCurrentUser()
  const projectId = useProjectId()
  const dataset = useDataset()
  const getClient = source.getClient

  return useMemo(() => {
    return {
      projectId,
      dataset,
      getClient,
      schema,
      currentUser,
    }
  }, [getClient, schema, currentUser, projectId, dataset])
}
