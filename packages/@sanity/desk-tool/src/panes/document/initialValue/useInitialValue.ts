import {useEffect, useMemo, useState} from 'react'
import {DocumentPaneNode} from '../../../types'
import {usePaneRouter} from '../../../contexts/paneRouter'
import {useUnique} from '../../../utils/useUnique'
import {getInitialValueObservable} from './getInitialValue'
import {InitialValueState} from './types'

/**
 * @internal
 */
export function useInitialValue(
  documentId: string,
  rawPaneOptions: DocumentPaneNode['options']
): InitialValueState {
  const paneRouter = usePaneRouter()
  const paneParams = useUnique(paneRouter.params)
  const panePayload = useUnique(paneRouter.payload)
  const paneOptions = useUnique(rawPaneOptions)
  const defaultValue = useMemo(() => ({_type: paneOptions.type}), [paneOptions.type])
  const urlTemplate = paneParams?.template

  const [state, setState] = useState<InitialValueState>({
    loading: false,
    error: null,
    value: defaultValue,
  })

  useEffect(() => {
    setState({loading: true, error: null, value: defaultValue})

    const initialValueOptions = {documentId, paneOptions, panePayload, urlTemplate}

    const sub = getInitialValueObservable(initialValueOptions).subscribe((msg) => {
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

    return () => sub.unsubscribe()
  }, [defaultValue, documentId, paneOptions, panePayload, urlTemplate])

  return state
}
