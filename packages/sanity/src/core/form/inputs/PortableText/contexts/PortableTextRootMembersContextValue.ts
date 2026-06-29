import {type Path, type SchemaType} from '@sanity/types'

import {type ArrayOfObjectsMember} from '../../../store'
import {type PortableTextInputProps} from '../../../types'

/**
 * Value shape for the {@link PortableTextRootMembersContext}.
 *
 * Carries the root form-store members of the Portable Text input,
 * the input's own path, and the render callbacks needed to build
 * `<FormInput>` elements for resolved nested members on demand.
 *
 * @internal
 */
export interface PortableTextRootMembersContextValue {
  /** Root-level array members of the Portable Text input. */
  rootMembers: ArrayOfObjectsMember[]
  /** Path of the Portable Text input within the document. */
  ptInputPath: Path
  /** Schema type of the Portable Text array. */
  schemaType: SchemaType
  /**
   * The same root members passed through to `<FormInput>` as its
   * `members` prop.
   */
  formInputMembers: ArrayOfObjectsMember[]
  /** Render callbacks forwarded from `PortableTextInputProps`. */
  renderAnnotation: PortableTextInputProps['renderAnnotation']
  renderBlock: PortableTextInputProps['renderBlock']
  renderField: PortableTextInputProps['renderField']
  renderInlineBlock: PortableTextInputProps['renderInlineBlock']
  renderInput: PortableTextInputProps['renderInput']
  renderItem: PortableTextInputProps['renderItem']
  renderPreview: PortableTextInputProps['renderPreview']
  onPathFocus: PortableTextInputProps['onPathFocus']
}
