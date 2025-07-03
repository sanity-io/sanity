import {useTranslation} from 'sanity'

import {structureLocaleNamespace} from '../../../../i18n'
import {useDocumentPane} from '../../useDocumentPane'
import {useDocumentTitle} from '../../useDocumentTitle'

export function DocumentHeaderTitle(): React.JSX.Element {
  const {connectionState, schemaType, value: documentValue} = useDocumentPane()
  const {title} = useDocumentTitle()
  const subscribed = Boolean(documentValue)

  const {t} = useTranslation(structureLocaleNamespace)

  if (connectionState === 'connecting' && !subscribed) {
    return <></>
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

  return (
    <>
      {title || (
        <span style={{color: 'var(--card-muted-fg-color)'}}>
          {t('panes.document-header-title.untitled.text')}
        </span>
      )}
    </>
  )
}
