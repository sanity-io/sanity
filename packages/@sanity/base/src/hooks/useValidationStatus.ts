import {Marker} from '@sanity/types'
import {useMemoObservable} from 'react-rx'
import {useDatastores} from '../datastores'

interface ValidationStatus {
  isValidating: boolean
  markers: Marker[]
}

const INITIAL: ValidationStatus = {markers: [], isValidating: false}

export function useValidationStatus(publishedDocId: string, docTypeName: string): ValidationStatus {
  const {documentStore} = useDatastores()

  return useMemoObservable(
    () => documentStore.pair.validation(publishedDocId, docTypeName),
    [publishedDocId, docTypeName],
    INITIAL
  )
}
