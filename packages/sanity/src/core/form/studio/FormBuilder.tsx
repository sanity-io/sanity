import {type ObjectSchemaType, type Path, type ValidationMarker} from '@sanity/types'
import {useCallback, useMemo, useRef} from 'react'

import {type DocumentFieldAction} from '../../config'
import {type FormNodePresence} from '../../presence'
import {PreviewLoader} from '../../preview'
import {EMPTY_ARRAY} from '../../util'
import {FormValueProvider} from '../contexts/FormValue'
import {GetFormValueProvider} from '../contexts/GetFormValue'
import {
  useAnnotationComponent,
  useBlockComponent,
  useFieldComponent,
  useInlineBlockComponent,
  useInputComponent,
  useItemComponent,
  usePreviewComponent,
} from '../form-components-hooks'
import {type FormPatch, type PatchChannel, PatchEvent} from '../patch'
import {type StateTree} from '../store'
import {type ObjectFormNode} from '../store/types/nodes'
import {
  type BlockAnnotationProps,
  type BlockProps,
  type FieldProps,
  type FormDocumentValue,
  type InputProps,
  type ItemProps,
  type ObjectInputProps,
  type RenderPreviewCallbackProps,
} from '../types'
import {DocumentFieldActionsProvider} from './contexts/DocumentFieldActions'
import {FormBuilderInputErrorBoundary} from './FormBuilderInputErrorBoundary'
import {FormProvider} from './FormProvider'
import {TreeEditingDialog, TreeEditingEnabledProvider, useTreeEditingEnabled} from './tree-editing'

/**
 * @alpha
 */
export interface FormBuilderProps
  extends Omit<ObjectFormNode, 'level' | 'path' | 'presence' | 'validation' | '_allMembers'> {
  /** @internal */
  __internal_fieldActions?: DocumentFieldAction[]
  /** @internal Considered internal – do not use. */
  __internal_patchChannel: PatchChannel

  autoFocus?: boolean
  changesOpen?: boolean
  collapsedFieldSets: StateTree<boolean> | undefined
  collapsedPaths: StateTree<boolean> | undefined
  focused: boolean | undefined
  focusPath: Path
  id: string
  onChange: (changeEvent: PatchEvent) => void
  onFieldGroupSelect: (path: Path, groupName: string) => void
  onPathBlur: (path: Path) => void
  onPathFocus: (path: Path) => void
  onPathOpen: (path: Path) => void
  onSetFieldSetCollapsed: (path: Path, collapsed: boolean) => void
  onSetPathCollapsed: (path: Path, collapsed: boolean) => void
  openPath?: Path
  presence: FormNodePresence[]
  readOnly?: boolean
  schemaType: ObjectSchemaType
  validation: ValidationMarker[]
  value: FormDocumentValue | undefined
}

/**
 * @alpha
 */
export function FormBuilder(props: FormBuilderProps) {
  const {
    __internal_fieldActions: fieldActions,
    __internal_patchChannel: patchChannel,
    autoFocus,
    changesOpen,
    collapsedFieldSets,
    collapsedPaths,
    focused,
    focusPath,
    groups,
    id,
    members,
    onChange,
    onFieldGroupSelect,
    onPathBlur,
    onPathFocus,
    onPathOpen,
    onSetFieldSetCollapsed,
    onSetPathCollapsed,
    openPath = EMPTY_ARRAY,
    presence,
    readOnly,
    schemaType,
    validation,
    value,
  } = props

  const handleCollapseField = useCallback(
    (fieldName: string) => onSetPathCollapsed([fieldName], true),
    [onSetPathCollapsed],
  )

  const handleExpandField = useCallback(
    (fieldName: string) => onSetPathCollapsed([fieldName], false),
    [onSetPathCollapsed],
  )

  const handleBlur = useCallback(() => onPathBlur(EMPTY_ARRAY), [onPathBlur])

  const handleFocus = useCallback(() => onPathFocus(EMPTY_ARRAY), [onPathFocus])

  const handleChange = useCallback(
    (patch: FormPatch | FormPatch[] | PatchEvent) => onChange(PatchEvent.from(patch)),
    [onChange],
  )

  const focusRef = useRef(null)

  const handleSelectFieldGroup = useCallback(
    (groupName: string) => onFieldGroupSelect(EMPTY_ARRAY, groupName),
    [onFieldGroupSelect],
  )

  const handleOpenField = useCallback((fieldName: string) => onPathOpen([fieldName]), [onPathOpen])

  const handleCloseField = useCallback(() => onPathOpen([]), [onPathOpen])

  const handleCollapseFieldSet = useCallback(
    (fieldSetName: string) => onSetFieldSetCollapsed([fieldSetName], true),
    [onSetFieldSetCollapsed],
  )

  const handleExpandFieldSet = useCallback(
    (fieldSetName: string) => onSetFieldSetCollapsed([fieldSetName], false),
    [onSetFieldSetCollapsed],
  )
  // These hooks may be stored in context as an perf optimization
  const Input = useInputComponent()
  const Field = useFieldComponent()
  const Preview = usePreviewComponent()
  const Item = useItemComponent()
  const Block = useBlockComponent()
  const InlineBlock = useInlineBlockComponent()
  const Annotation = useAnnotationComponent()

  const renderInput = useCallback(
    (inputProps: Omit<InputProps, 'renderDefault'>) => (
      <FormBuilderInputErrorBoundary>
        <Input {...inputProps} />
      </FormBuilderInputErrorBoundary>
    ),
    [Input],
  )
  const renderField = useCallback(
    (fieldProps: Omit<FieldProps, 'renderDefault'>) => <Field {...fieldProps} />,
    [Field],
  )
  const renderItem = useCallback(
    ({key, ...itemProps}: Omit<ItemProps, 'renderDefault'>) => <Item key={key} {...itemProps} />,
    [Item],
  )
  const renderPreview = useCallback(
    (previewProps: RenderPreviewCallbackProps) => (
      <PreviewLoader component={Preview} {...previewProps} />
    ),
    [Preview],
  )
  const renderBlock = useCallback(
    (blockProps: Omit<BlockProps, 'renderDefault'>) => <Block {...blockProps} />,
    [Block],
  )
  const renderInlineBlock = useCallback(
    (blockProps: Omit<BlockProps, 'renderDefault'>) => <InlineBlock {...blockProps} />,
    [InlineBlock],
  )
  const renderAnnotation = useCallback(
    (annotationProps: Omit<BlockAnnotationProps, 'renderDefault'>) => (
      <Annotation {...annotationProps} />
    ),
    [Annotation],
  )

  const rootInputProps: Omit<ObjectInputProps, 'renderDefault'> = useMemo(() => {
    return {
      focusPath,
      elementProps: {
        'ref': focusRef,
        id,
        'onBlur': handleBlur,
        'onFocus': handleFocus,
        'aria-describedby': undefined, // Root input should not have any aria-describedby
      },
      changed: members.some((m) => m.kind === 'field' && m.field.changed),
      focused,
      groups,
      id,
      level: 0,
      members,
      onChange: handleChange,
      onFieldClose: handleCloseField,
      onFieldCollapse: handleCollapseField,
      onFieldSetCollapse: handleCollapseFieldSet,
      onFieldExpand: handleExpandField,
      onFieldSetExpand: handleExpandFieldSet,
      onPathFocus: onPathFocus,
      onFieldOpen: handleOpenField,
      onFieldGroupSelect: handleSelectFieldGroup,
      path: EMPTY_ARRAY,
      presence: EMPTY_ARRAY,
      readOnly,
      renderAnnotation,
      renderBlock,
      renderField,
      renderInlineBlock,
      renderInput,
      renderItem,
      renderPreview,
      schemaType,
      validation: EMPTY_ARRAY,
      value,
    }
  }, [
    focusPath,
    focused,
    groups,
    handleBlur,
    handleChange,
    handleCloseField,
    handleCollapseField,
    handleCollapseFieldSet,
    handleExpandField,
    handleExpandFieldSet,
    handleFocus,
    handleOpenField,
    handleSelectFieldGroup,
    id,
    members,
    onPathFocus,
    readOnly,
    renderAnnotation,
    renderBlock,
    renderField,
    renderInlineBlock,
    renderInput,
    renderItem,
    renderPreview,
    schemaType,
    value,
  ])

  return (
    <FormProvider
      __internal_fieldActions={fieldActions}
      __internal_patchChannel={patchChannel}
      autoFocus={autoFocus}
      changesOpen={changesOpen}
      collapsedFieldSets={collapsedFieldSets}
      collapsedPaths={collapsedPaths}
      focusPath={focusPath}
      focused={focused}
      groups={groups}
      id={id}
      onChange={onChange}
      onPathBlur={onPathBlur}
      onPathFocus={onPathFocus}
      onPathOpen={onPathOpen}
      onFieldGroupSelect={onFieldGroupSelect}
      onSetPathCollapsed={onSetPathCollapsed}
      onSetFieldSetCollapsed={onSetFieldSetCollapsed}
      presence={presence}
      validation={validation}
      readOnly={readOnly}
      schemaType={schemaType}
    >
      <GetFormValueProvider value={value}>
        <FormValueProvider value={value}>
          <DocumentFieldActionsProvider actions={fieldActions}>
            <TreeEditingEnabledProvider>
              <RootInput
                rootInputProps={rootInputProps}
                onPathOpen={onPathOpen}
                openPath={openPath}
                renderInput={renderInput}
              />
            </TreeEditingEnabledProvider>
          </DocumentFieldActionsProvider>
        </FormValueProvider>
      </GetFormValueProvider>
    </FormProvider>
  )
}

interface RootInputProps {
  rootInputProps: Omit<ObjectInputProps, 'renderDefault'>
  onPathOpen: (path: Path) => void
  openPath: Path
  renderInput: (props: Omit<ObjectInputProps, 'renderDefault'>) => React.JSX.Element
}

function RootInput(props: RootInputProps) {
  const {rootInputProps, onPathOpen, openPath, renderInput} = props
  const treeEditing = useTreeEditingEnabled()
  const isRoot = rootInputProps.id === 'root'

  const arrayEditingModal = treeEditing.enabled && isRoot && (
    <TreeEditingDialog
      // eslint-disable-next-line react/jsx-handler-names
      onPathFocus={rootInputProps.onPathFocus}
      onPathOpen={onPathOpen}
      openPath={openPath}
      rootInputProps={rootInputProps}
      schemaType={rootInputProps.schemaType}
    />
  )

  return renderInput({
    ...rootInputProps,
    // eslint-disable-next-line camelcase
    __internal_arrayEditingModal: arrayEditingModal,
  })
}
