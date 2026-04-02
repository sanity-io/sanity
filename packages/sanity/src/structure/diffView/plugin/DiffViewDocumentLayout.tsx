import {useTelemetry} from '@sanity/telemetry/react'
import {useToast} from '@sanity/ui'
import {type ComponentType, type PropsWithChildren} from 'react'
import {
  type DocumentVariantType,
  type DocumentLayoutProps,
  getDocumentVariantType,
  useTranslation,
} from 'sanity'

import {structureLocaleNamespace} from '../../i18n'
import {
  DiffViewEntered,
  DiffViewExited,
  DiffViewDocumentSelectionChanged,
} from '../__telemetry__/diffView.telemetry'
import {DiffView} from '../components/DiffView'
import {selectActiveTransition, useDiffViewState} from '../hooks/useDiffViewState'

export const DiffViewDocumentLayout: ComponentType<
  PropsWithChildren<Pick<DocumentLayoutProps, 'documentId' | 'documentType'>>
> = ({children, documentId}) => {
  const toast = useToast()
  const {t} = useTranslation(structureLocaleNamespace)
  const {log} = useTelemetry()
  const {isActive, documents} = useDiffViewState({
    onParamsError: (errors) => {
      toast.push({
        id: 'diffViewParamsParsingError',
        status: 'error',
        title: t('compare-version.error.invalidParams.title'),
        description: (
          <ul>
            {errors.map(([error, input]) => (
              <li key={error}>
                {t(`compare-version.error.${error}`, {
                  input,
                })}
              </li>
            ))}
          </ul>
        ),
      })
    },
    onActiveChanged: (previousState, state) => {
      if (selectActiveTransition(previousState, state) === 'entered') {
        log(DiffViewEntered, {
          documentVariantTypes: documentIdsToVariantTypes([
            state.documents?.previous.id,
            state.documents?.next.id,
          ]),
        })
        return
      }

      if (
        selectActiveTransition(previousState, state) === 'exited' &&
        typeof previousState !== 'undefined'
      ) {
        log(DiffViewExited, {
          documentVariantTypes: documentIdsToVariantTypes([
            previousState.documents?.previous.id,
            previousState.documents?.next.id,
          ]),
        })
      }
    },
    onTargetDocumentsChanged: (previousState, state) => {
      if (typeof previousState === 'undefined') {
        return
      }

      log(DiffViewDocumentSelectionChanged, {
        previousDocumentVariantTypes: documentIdsToVariantTypes([
          previousState.documents?.previous.id,
          previousState.documents?.next.id,
        ]),
        documentVariantTypes: documentIdsToVariantTypes([
          state.documents?.previous.id,
          state.documents?.next.id,
        ]),
      })
    },
  })

  return (
    <>
      {children}
      {isActive && <DiffView documentId={documentId} />}
    </>
  )
}

function documentIdsToVariantTypes(ids: (string | undefined)[]): DocumentVariantType[] {
  return ids.filter((id) => typeof id === 'string').map(getDocumentVariantType)
}
