import {vars} from '@sanity/ui/css'
import {useTranslation} from 'sanity'

import {structureLocaleNamespace} from '../../../../i18n'
import {useDocumentPane} from '../../useDocumentPane'
import {useDocumentTitle} from '../../useDocumentTitle'

export function DocumentHeaderTitle(): React.JSX.Element {
  const {connectionState, schemaType, title, value: documentValue} = useDocumentPane()
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
      {documentTitle || (
        <span style={{color: vars.color.muted.fg}}>
          {t('panes.document-header-title.untitled.text')}
        </span>
      )}
    </>
  )
}
