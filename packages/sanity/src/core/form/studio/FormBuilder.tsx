/* eslint-disable camelcase */
/* eslint-disable react/jsx-handler-names */

import {ObjectSchemaType, Path, ValidationMarker} from '@sanity/types'
import React, {useCallback, useRef} from 'react'
import {FormPatch, PatchChannel, PatchEvent} from '../patch'
import {ObjectFormNode} from '../store/types/nodes'
import {
  BlockAnnotationProps,
  BlockProps,
  FieldProps,
  InputProps,
  ItemProps,
  ObjectInputProps,
  RenderPreviewCallbackProps,
} from '../types'
import {StateTree} from '../store'
import {EMPTY_ARRAY} from '../../util'
import {FormNodePresence} from '../../presence'
import {DocumentFieldAction} from '../../config'
import {useSource} from '../../studio'
import {
  useAnnotationComponent,
  useBlockComponent,
  useFieldComponent,
  useInlineBlockComponent,
  useInputComponent,
  useItemComponent,
  usePreviewComponent,
} from '../form-components-hooks'
import {PreviewLoader} from '../../preview'
import type {FormDocumentValue} from '../types'
import {FormValueProvider} from '../contexts/FormValue'
import {FormProvider} from './FormProvider'
import {DocumentFieldActionsProvider} from './contexts/DocumentFieldActions'

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
  focusPath: Path
  focused: boolean | undefined
  id: string
  onChange: (changeEvent: PatchEvent) => void
  onPathBlur: (path: Path) => void
  onPathFocus: (path: Path) => void
  onPathOpen: (path: Path) => void
  onFieldGroupSelect: (path: Path, groupName: string) => void
  onSetFieldSetCollapsed: (path: Path, collapsed: boolean) => void
  onSetPathCollapsed: (path: Path, collapsed: boolean) => void
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
    focusPath,
    focused,
    groups,
    id,
    members,
    onChange,
    onPathBlur,
    onPathFocus,
    onPathOpen,
    onFieldGroupSelect,
    onSetFieldSetCollapsed,
    onSetPathCollapsed,
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

  const {file, image} = useSource().form

  // These hooks may be stored in context as an perf optimization
  const Input = useInputComponent()
  const Field = useFieldComponent()
  const Preview = usePreviewComponent()
  const Item = useItemComponent()
  const Block = useBlockComponent()
  const InlineBlock = useInlineBlockComponent()
  const Annotation = useAnnotationComponent()

  const renderInput = useCallback(
    (inputProps: Omit<InputProps, 'renderDefault'>) => <Input {...inputProps} />,
    [Input],
  )
  const renderField = useCallback(
    (fieldProps: Omit<FieldProps, 'renderDefault'>) => <Field {...fieldProps} />,
    [Field],
  )
  const renderItem = useCallback(
    (itemProps: Omit<ItemProps, 'renderDefault'>) => <Item {...itemProps} />,
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

  const rootInputProps: Omit<ObjectInputProps, 'renderDefault'> = {
    focusPath,
    elementProps: {
      ref: focusRef,
      id,
      onBlur: handleBlur,
      onFocus: handleFocus,
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
      members={members}
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
      value={value}
    >
      <FormValueProvider value={value}>
        <DocumentFieldActionsProvider actions={fieldActions}>
          {renderInput(rootInputProps)}
        </DocumentFieldActionsProvider>
      </FormValueProvider>
    </FormProvider>
  )
}
