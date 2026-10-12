import {useTelemetry} from '@sanity/telemetry/react'
import {useToast} from '@sanity/ui/toast'
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

// Toast content renders above `LocaleProvider`, so it cannot translate anything itself - the
// caller, which does render under the active workspace's i18n context, passes translated messages.
function paramsErrorDescription(messages: {error: string; message: string}[]) {
  return (
    <ul>
      {messages.map(({error, message}) => (
        <li key={error}>{message}</li>
      ))}
    </ul>
  )
}

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
        description: paramsErrorDescription(
          errors.map(([error, input]) => ({
            error,
            message: t(`compare-version.error.${error}`, {
              input,
            }),
          })),
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
