import {InitialValueResolverContext, SanityDocumentLike} from '@sanity/types'
import {useEffect, useMemo, useState} from 'react'
import {useDataset, useProjectId, useSchema} from '../../../hooks'
import {useSource} from '../../../studio'
import {useUnique} from '../../../util'
import {useCurrentUser} from '../../user'
import {useDocumentStore} from '../datastores'
import {InitialValueState} from './initialValue/types'

/**
 * @internal
 */
export function useInitialValue(props: {
  documentId: string
  documentType: string
  templateName?: string
  templateParams?: Record<string, unknown>
}): InitialValueState {
  const {documentId, documentType, templateName, templateParams: templateParamsRaw} = props
  const templateParams = useUnique(templateParamsRaw)
  const documentStore = useDocumentStore()
  const context = useInitialValueResolverContext()

  const defaultValue: SanityDocumentLike = useMemo(
    () => ({_id: documentId, _type: documentType}),
    [documentId, documentType]
  )

  const [state, setState] = useState<InitialValueState>({
    loading: false,
    error: null,
    value: defaultValue,
  })

  useEffect(() => {
    const initialValueOptions = {documentId, documentType, templateName, templateParams}

    if (!templateName) {
      setState({loading: true, error: null, value: defaultValue})
      return undefined
    }

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
        setState({loading: false, error: msg.error, value: defaultValue})
      }
    })

    setState({loading: true, error: null, value: defaultValue})

    return () => sub.unsubscribe()
  }, [defaultValue, documentId, documentStore, documentType, templateName, templateParams, context])

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
