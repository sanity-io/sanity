import {useTelemetry} from '@sanity/telemetry/react'
import {useToast} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {type ComponentType, type PropsWithChildren, useState} from 'react'
import {
  type DocumentVariantType,
  type DocumentLayoutProps,
  getDocumentVariantType,
  useTranslation,
  useWorkspace,
} from 'sanity'
import {DiffViewSessionContext} from 'sanity/_singletons'

import {structureLocaleNamespace} from '../../i18n'
import {
  DiffViewDocumentSelectionChanged,
  DiffViewEntered,
  DiffViewExited,
} from '../__telemetry__/diffView.telemetry'
import {DiffView} from '../components/DiffView'
import {useDiffViewState, selectActiveTransition} from '../hooks/useDiffViewState'

export const DiffViewDocumentLayout: ComponentType<
  PropsWithChildren<Pick<DocumentLayoutProps, 'documentId' | 'documentType'>>
> = ({children, documentId, documentType}) => {
  const toast = useToast()
  const {t} = useTranslation(structureLocaleNamespace)
  const telemetry = useTelemetry()
  const workspace = useWorkspace()
  const advancedVersionControlEnabled = workspace.advancedVersionControl?.enabled ?? false
  const [sessionId, setSessionId] = useState<string | null>(null)

  const {isActive} = useDiffViewState({
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
    // Attach telemetry callbacks only when the feature is enabled.
    ...(advancedVersionControlEnabled && {
      onActiveChanged: (previousState, state) => {
        const transition = selectActiveTransition(previousState, state)

        if (transition === 'entered') {
          const nextSessionId = uuid()
          setSessionId(nextSessionId)
          telemetry.log(DiffViewEntered, {
            documentVariantTypes: documentIdsToVariantTypes([
              state.documents?.previous.id,
              state.documents?.next.id,
            ]),
            sessionId: nextSessionId,
            documentType,
          })
          return
        }

        if (transition === 'exited' && typeof previousState !== 'undefined') {
          telemetry.log(DiffViewExited, {
            documentVariantTypes: documentIdsToVariantTypes([
              previousState.documents?.previous.id,
              previousState.documents?.next.id,
            ]),
            sessionId,
            documentType,
          })
          setSessionId(null)
        }
      },
      onTargetDocumentsChanged: (previousState, state) => {
        if (typeof previousState === 'undefined') return

        telemetry.log(DiffViewDocumentSelectionChanged, {
          previousDocumentVariantTypes: documentIdsToVariantTypes([
            previousState.documents?.previous.id,
            previousState.documents?.next.id,
          ]),
          documentVariantTypes: documentIdsToVariantTypes([
            state.documents?.previous.id,
            state.documents?.next.id,
          ]),
          sessionId,
          documentType,
        })
      },
    }),
  })

  return (
    <DiffViewSessionContext.Provider value={sessionId}>
      {children}
      {isActive && <DiffView documentId={documentId} />}
    </DiffViewSessionContext.Provider>
  )
}

function documentIdsToVariantTypes(ids: (string | undefined)[]): DocumentVariantType[] {
  return ids.filter((id) => typeof id === 'string').map(getDocumentVariantType)
}
