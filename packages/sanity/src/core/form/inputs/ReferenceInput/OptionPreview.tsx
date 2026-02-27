import {type ReferenceSchemaType} from '@sanity/types'
import {Stack} from '@sanity/ui'

import {useTranslation} from '../../../i18n'
import {type RenderPreviewCallback} from '../../types'
import {ReferencePreview} from './ReferencePreview'

/**
 * Used to preview a referenced type
 * Takes the reference type as props
 *
 * @internal
 */
export function OptionPreview(props: {
  id: string
  type: string
  referenceType: ReferenceSchemaType
  renderPreview: RenderPreviewCallback
}) {
  const {referenceType, type, id: documentId, renderPreview} = props
  const refType = referenceType.to.find((toType) => toType.name === type)
  const {t} = useTranslation()

  if (!refType) {
    return (
      <Stack space={2} padding={1}>
        {t('inputs.reference.error.invalid-search-result-type-title', {
          returnedType: type,
        })}
      </Stack>
    )
  }
  return (
    <ReferencePreview
      id={documentId}
      layout="default"
      refType={refType}
      renderPreview={renderPreview}
      showTypeLabel={referenceType.to.length > 1}
    />
  )
}
