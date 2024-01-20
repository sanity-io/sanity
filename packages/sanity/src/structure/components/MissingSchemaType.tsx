import {WarningOutlineIcon} from '@sanity/icons'
import {type SanityDocument} from '@sanity/types'
import {type GeneralPreviewLayoutKey, SanityDefaultPreview, Translate, useTranslation} from 'sanity'

import {structureLocaleNamespace} from '../i18n'

export interface MissingSchemaTypeProps {
  layout?: GeneralPreviewLayoutKey
  value: SanityDocument
}

export function MissingSchemaType(props: MissingSchemaTypeProps) {
  const {t} = useTranslation(structureLocaleNamespace)
  const {layout, value} = props

  return (
    <SanityDefaultPreview
      title={
        <em>
          <Translate
            t={t}
            i18nKey="pane-item.missing-schema-type.title"
            components={{Code: 'code'}}
            values={{documentType: value._type}}
          />
        </em>
      }
      subtitle={
        <Translate
          t={t}
          i18nKey="pane-item.missing-schema-type.subtitle"
          components={{Code: 'code'}}
          values={{documentId: value._id}}
        />
      }
      // eslint-disable-next-line react/jsx-no-bind
      media={() => <WarningOutlineIcon />}
      layout={layout}
    />
  )
}
