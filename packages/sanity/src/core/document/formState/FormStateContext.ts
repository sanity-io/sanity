import {SanityDocumentLike, ObjectSchemaType, ValidationMarker, Path} from '@sanity/types'
import {createContext} from 'react'
import {PatchEvent, DocumentFormNode, StateTree} from '../../form'
import {ConnectionState} from '../../hooks'
import {EditStateFor, PermissionCheckResult} from '../../store'

export interface FormStateContextValue<TDocument extends SanityDocumentLike> {
  documentId: string
  documentType: string

  /**
   * the current value of the form. note that this supersedes both the `value`
   * and the `displayed` prop from the previous `DocumentPaneContextValue`
   * interface
   */
  value: TDocument

  editState: EditStateFor

  /**
   * if the value originates from the current value from context lake, then this
   * will be `current-value`. if the value is from a historical revision then
   * it will be `historical-value`, if the value is from an initial value
   * template then it will be `initial-value`
   */
  valueOrigin: 'draft-value' | 'published-value' | 'initial-value' | 'historical-value' | undefined

  schemaType: ObjectSchemaType

  /**
   * The value that is used to compare changes since a particular time. This is
   * used to show change indicators. For example, this value is typically the
   * published version of the document so that while you're editing the draft,
   * the published version can be compared to the current draft version.
   */
  compareValue: TDocument | null

  /**
   * Signals when the document is ready for editing. Considers the connection
   * state, edit states, and whether or not the timeline is ready.
   */
  ready: boolean

  /**
   * Propagates changes described by a patch event message to the form value.
   */
  patchValue: (event: PatchEvent) => void

  /**
   * Contains the prepared root form node state. This is the result of
   * `prepareFormState`.
   */
  formState: DocumentFormNode | null

  focusPath: Path
  setFocusPath: (path: Path) => void

  openPath: Path
  setOpenPath: (path: Path) => void

  collapsedFieldsets: StateTree<boolean>
  setFieldsetCollapsed: (path: Path, collapsed: boolean) => void

  collapsedPaths: StateTree<boolean>
  setPathCollapsed: (path: Path, collapsed: boolean) => void

  activeFieldGroups: StateTree<string>
  setActiveFieldGroup: (path: Path, groupName: string) => void

  validation: ValidationMarker[]
  permissions: PermissionCheckResult | undefined
  isPermissionsLoading: boolean

  connectionState: ConnectionState

  delete: () => void
  isDeleting: boolean
  isDeleted: boolean
}

export const FormStateContext = createContext<FormStateContextValue<SanityDocumentLike> | null>(
  null,
)
