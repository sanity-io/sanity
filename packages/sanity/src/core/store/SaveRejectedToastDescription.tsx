import {CopyIcon} from '@sanity/icons/Copy'
import {type ObjectSchemaType, type SanityDocument, type Schema} from '@sanity/types'
import {Inline, Stack, Text} from '@sanity/ui'
import {type ToastParams} from '@sanity/ui/toast'
import {useCallback} from 'react'

import {Button} from '../../ui-components/button/Button'
import {prepareForPreview} from '../preview/utils/prepareForPreview'
import {useCopyToClipboard} from '../studio/hooks/useCopyToClipboard'
import {type DiscardedText} from './document/document-pair/getDiscardedText'

/** @internal */
export interface LabelledText {
  label: string
  text: string
}

/** The document's preview title, or `undefined` when it has none to show */
export function getRejectedDocumentTitle(
  schema: Schema,
  document: SanityDocument | null,
): string | undefined {
  const schemaType = document ? schema.get(document._type) : undefined
  if (document === null || schemaType === undefined) return undefined
  const {title} = prepareForPreview(document, schemaType)
  return typeof title === 'string' && title.length > 0 ? title : undefined
}

/** Labels each piece of discarded text with the title of its field */
export function labelDiscardedText(
  schema: Schema,
  document: SanityDocument | null,
  discardedText: DiscardedText[],
): LabelledText[] {
  const schemaType = document
    ? (schema.get(document._type) as ObjectSchemaType | undefined)
    : undefined
  return discardedText.map(({field, text}) => {
    const fieldType = schemaType?.fields?.find((candidate) => candidate.name === field)?.type
    return {label: fieldType?.title ?? field, text}
  })
}

/** One value per paragraph, under a field heading when more than one field changed */
export function formatDiscardedText(entries: LabelledText[]): string {
  const labels = [...new Set(entries.map(({label}) => label))]
  if (labels.length < 2) return entries.map(({text}) => text).join('\n\n')
  return labels
    .map((label) =>
      [label, ...entries.filter((entry) => entry.label === label).map(({text}) => text)].join(
        '\n\n',
      ),
    )
    .join('\n\n')
}

interface SaveRejectedToastDescriptionProps {
  description: string
  copyLabel: string
  discardedText: LabelledText[]
}

/** @internal */
export function SaveRejectedToastDescription({
  description,
  copyLabel,
  discardedText,
}: SaveRejectedToastDescriptionProps) {
  const [, copy] = useCopyToClipboard()
  const handleCopy = useCallback(() => {
    void copy(formatDiscardedText(discardedText))
  }, [copy, discardedText])

  return (
    <Stack gap={3}>
      <Text size={1}>{description}</Text>
      {discardedText.length > 0 && (
        <Inline>
          <Button icon={CopyIcon} mode="ghost" onClick={handleCopy} text={copyLabel} />
        </Inline>
      )}
    </Stack>
  )
}

interface SaveRejectedToastOptions extends SaveRejectedToastDescriptionProps {
  documentId: string
  title: string
}

/** @internal */
export function createSaveRejectedToast({
  documentId,
  title,
  ...descriptionProps
}: SaveRejectedToastOptions): ToastParams {
  return {
    id: `document-store.save-rejected.${documentId}`,
    status: 'error',
    closable: true,
    duration: Infinity,
    title,
    description: <SaveRejectedToastDescription {...descriptionProps} />,
  }
}
