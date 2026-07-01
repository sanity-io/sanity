import {type InitialValueResolverContext, type SanityDocumentLike} from '@sanity/types'
import {useToast} from '@sanity/ui'
import {useEffect, useMemo, useState} from 'react'

import {useDataset, useProjectId, useSchema} from '../../hooks'
import {useTranslation} from '../../i18n'
import {classifyRequestError, useSource, useStudioErrorHandler} from '../../studio'
import {getVersionId, useUnique} from '../../util'
import {useDocumentStore} from '../datastores'
import {useCurrentUser} from '../user'
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

  const [state, setState] = useState<InitialValueState>({
    loading: false,
    error: null,
    value: defaultValue,
  })

  useEffect(() => {
    const initialValueOptions = {documentId, documentType, templateName, templateParams}

    const initialValueMsg$ = documentStore.initialValue(initialValueOptions, context)
    const sub = initialValueMsg$.subscribe((msg) => {
      if (msg.type === 'loading') {
        setState({loading: true, error: null, value: defaultValue})
      }

      if (msg.type === 'success') {
        setState({
          loading: false,
          error: null,
          value: msg.value ? {...defaultValue, ...msg.value} : defaultValue,
        })
      }

      if (msg.type === 'error') {
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
        setState({loading: false, error: msg.error, value: defaultValue})
      }
    })

    // oxlint-disable-next-line react/react-compiler
    setState({loading: true, error: null, value: defaultValue})

    return () => sub.unsubscribe()
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
  ])

  return state
}

/**
 * @internal
 */
export function useInitialValueResolverContext(): InitialValueResolverContext {
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
