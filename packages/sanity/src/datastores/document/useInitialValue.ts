import {SanityDocumentLike} from '@sanity/types'
import {useEffect, useMemo, useState} from 'react'
import {useUnique} from '../../util/useUnique'
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

    const initialValueMsg$ = documentStore.initialValue(initialValueOptions)

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
  }, [defaultValue, documentId, documentStore, documentType, templateName, templateParams])

  return state
}
