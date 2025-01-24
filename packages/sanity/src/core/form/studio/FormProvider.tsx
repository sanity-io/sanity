import {type ObjectSchemaType, type Path, type ValidationMarker} from '@sanity/types'
import {type ReactNode, useCallback} from 'react'

import {type DocumentFieldAction} from '../../config'
import {type FormNodePresence} from '../../presence'
import {PreviewLoader} from '../../preview/components/PreviewLoader'
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
import {FormBuilderProvider} from '../FormBuilderProvider'
import {type PatchChannel, type PatchEvent} from '../patch'
import {type FormFieldGroup, type StateTree} from '../store'
import {
  type BlockAnnotationProps,
  type BlockProps,
  type FieldProps,
  type InputProps,
  type ItemProps,
  type RenderPreviewCallbackProps,
} from '../types'

/**
 * @alpha This API might change.
 */
export interface FormProviderProps {
  /** @internal */
  __internal_fieldActions?: DocumentFieldAction[]
  /** @internal Considered internal, do not use. */
  __internal_patchChannel: PatchChannel

  autoFocus?: boolean
  changesOpen?: boolean
  children?: ReactNode
  collapsedFieldSets: StateTree<boolean> | undefined
  collapsedPaths: StateTree<boolean> | undefined
  focusPath: Path
  focused: boolean | undefined
  groups: FormFieldGroup[]
  id: string
  onChange: (changeEvent: PatchEvent) => void
  onPathBlur: (path: Path) => void
  onPathFocus: (path: Path) => void
  onPathOpen: (path: Path) => void
  onFieldGroupSelect: (path: Path, groupName: string) => void
  onSetPathCollapsed: (path: Path, collapsed: boolean) => void
  onSetFieldSetCollapsed: (path: Path, collapsed: boolean) => void
  presence: FormNodePresence[]
  readOnly?: boolean
  schemaType: ObjectSchemaType
  validation: ValidationMarker[]
}

/**
 * Default wiring for `FormBuilderProvider` when used with Sanity
 *
 * @alpha This API might change.
 */
export function FormProvider(props: FormProviderProps) {
  const {
    __internal_fieldActions: fieldActions,
    __internal_patchChannel: patchChannel,
    autoFocus,
    changesOpen,
    children,
    collapsedFieldSets,
    collapsedPaths,
    focusPath,
    focused,
    groups,
    id,
    onChange,
    onPathBlur,
    onPathFocus,
    onPathOpen,
    onFieldGroupSelect,
    onSetPathCollapsed,
    onSetFieldSetCollapsed,
    presence,
    readOnly,
    schemaType,
    validation,
  } = props

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

  return (
    <FormBuilderProvider
      __internal_fieldActions={fieldActions}
      __internal_patchChannel={patchChannel}
      autoFocus={autoFocus}
      changesOpen={changesOpen}
      collapsedFieldSets={collapsedFieldSets}
      collapsedPaths={collapsedPaths}
      file={file}
      focusPath={focusPath}
      focused={focused}
      groups={groups}
      id={id}
      image={image}
      onChange={onChange}
      onPathBlur={onPathBlur}
      onPathFocus={onPathFocus}
      onPathOpen={onPathOpen}
      onFieldGroupSelect={onFieldGroupSelect}
      onSetPathCollapsed={onSetPathCollapsed}
      onSetFieldSetCollapsed={onSetFieldSetCollapsed}
      presence={presence}
      readOnly={readOnly}
      renderAnnotation={renderAnnotation}
      renderBlock={renderBlock}
      renderField={renderField}
      renderInlineBlock={renderInlineBlock}
      renderInput={renderInput}
      renderItem={renderItem}
      renderPreview={renderPreview}
      schemaType={schemaType}
      validation={validation}
    >
      {children}
    </FormBuilderProvider>
  )
}
