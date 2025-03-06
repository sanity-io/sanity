import {useToast} from '@sanity/ui'
import {type ComponentType, type PropsWithChildren} from 'react'
import {type DocumentLayoutProps, useTranslation} from 'sanity'

import {structureLocaleNamespace} from '../../i18n'
import {DiffView} from '../components/DiffView'
import {useDiffViewState} from '../hooks/useDiffViewState'

export const DiffViewDocumentLayout: ComponentType<
  PropsWithChildren<Pick<DocumentLayoutProps, 'documentId' | 'documentType'>>
> = ({children, documentId}) => {
  const toast = useToast()
  const {t} = useTranslation(structureLocaleNamespace)
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
  })

  return (
    <>
      {children}
      {isActive && <DiffView documentId={documentId} />}
    </>
  )
}
