import {useTranslation} from 'sanity'

import {structureLocaleNamespace} from '../../../../i18n'
import {useResolvedPanesList} from '../../../../structureResolvers/useResolvedPanesList'
import {useDocumentPane} from '../../useDocumentPane'
import {useDocumentTitle} from '../../useDocumentTitle'
import {DocumentHeaderBreadcrumb} from './DocumentHeaderBreadcrumb'

export function DocumentHeaderTitle(): React.JSX.Element {
  const {connectionState, schemaType, title, value: documentValue, index} = useDocumentPane()
  const {paneDataItems, maximizedPane} = useResolvedPanesList()
  const {title: documentTitle, error} = useDocumentTitle()
  const subscribed = Boolean(documentValue)

  const {t} = useTranslation(structureLocaleNamespace)

  if (connectionState === 'connecting' && !subscribed) {
    return <></>
  }

  if (title) {
    return <>{title}</>
  }

  if (!documentValue) {
    return (
      <>
        {t('panes.document-header-title.new.text', {
          schemaType: schemaType?.title || schemaType?.name,
        })}
      </>
    )
  }

  if (error) {
    return <>{t('panes.document-header-title.error.text', {error: error})}</>
  }

  return (
    <>
      {maximizedPane ? (
        <DocumentHeaderBreadcrumb paneDataItems={paneDataItems} currentPaneIndex={index} />
      ) : (
        documentTitle || (
          <span style={{color: 'var(--card-muted-fg-color)'}}>
            {t('panes.document-header-title.untitled.text')}
          </span>
        )
      )}
    </>
  )
}
