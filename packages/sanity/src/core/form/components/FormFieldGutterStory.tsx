import {defineField, defineType, type SanityDocument} from '@sanity/types'

import {TestForm} from '../../../../test/browser/TestForm'
import {TestWrapper} from '../../../../test/browser/TestWrapper'

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({type: 'string', name: 'title', title: 'Title'}),
      defineField({type: 'string', name: 'subtitle', title: 'Subtitle'}),
    ],
  }),
]

/**
 * Differs from the displayed document in `title` only. `subtitle` is deliberately identical, so
 * the fixture distinguishes "this document differs from its base variant" from "this *field*
 * differs" — document metadata (`_id`, `_rev`, `_updatedAt`) always differs between a variant and
 * its base, which is why comparison is per field rather than whole-document.
 */
export const BASE_VARIANT_DOCUMENT: SanityDocument = {
  _id: 'base-variant',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: 'base-variant-rev',
  title: 'Base title',
  subtitle: 'Shared subtitle',
}

const DOCUMENT: SanityDocument = {
  _id: 'variant',
  _type: 'test',
  _createdAt: '2024-01-02T00:00:00.000Z',
  _updatedAt: '2024-01-02T00:00:00.000Z',
  _rev: 'variant-rev',
  title: 'Variant title',
  subtitle: 'Shared subtitle',
}

/**
 * Renders a real form (schema, `useFormState`, `FormBuilder`) so the gutter indicator is driven by
 * the `changedFromBaseVariant` the form store actually computes, rather than by a hand-set prop.
 * Omit `baseVariantDocument` to exercise the "no base variant to compare against" gate.
 */
export function FormFieldGutterStory({
  baseVariantDocument,
}: {
  baseVariantDocument?: SanityDocument
}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm document={DOCUMENT} baseVariantDocument={baseVariantDocument} />
    </TestWrapper>
  )
}
