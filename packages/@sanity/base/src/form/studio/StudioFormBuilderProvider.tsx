import {ObjectSchemaType, Path, Schema, SchemaType} from '@sanity/types'
import React, {useCallback} from 'react'
import {useSource} from '../../studio'
import {FIXME, FormPreviewComponentResolver, RenderFieldCallback} from '../types'
import {SanityPreview} from '../../preview'
import {FormBuilderProvider} from '../FormBuilderProvider'
import {PatchChannel} from '../patch/PatchChannel'
import {PatchArg, PatchEvent} from '../patch'
import {resolveInputComponent as defaultInputResolver} from './inputResolver/inputResolver'

const previewResolver: FormPreviewComponentResolver = (..._: unknown[]) => {
  // @todo: Implement correct typing here
  return SanityPreview as FIXME
}

/**
 * @alpha This API might change.
 */
export interface StudioFormBuilderProviderProps {
  /**
   * @internal Considered internal, do not use.
   */
  __internal_patchChannel: PatchChannel // eslint-disable-line camelcase
  children: React.ReactElement
  onBlur?: () => void
  onChange?: (event: PatchEvent) => void
  onFocus?: (path: Path) => void
  onSelectFieldGroup?: (path: Path, groupName: string) => void
  onSetCollapsed?: (path: Path, collapsed: boolean) => void
  onSetCollapsedFieldSet?: (path: Path, collapsed: boolean) => void
  renderField: RenderFieldCallback
  type: ObjectSchemaType
  schema: Schema
  value: any | null
}

const noop = () => undefined

/**
 * Default wiring for `FormBuilderProvider` when used with Sanity
 *
 * @alpha This API might change.
 */
export function StudioFormBuilderProvider(props: StudioFormBuilderProviderProps) {
  const {
    __internal_patchChannel: patchChannel,
    children,
    onBlur,
    onChange = noop,
    onFocus,
    onSelectFieldGroup,
    onSetCollapsed,
    onSetCollapsedFieldSet,
    renderField,
    schema,
    type,
    value,
  } = props

  const {unstable_formBuilder: formBuilder} = useSource()

  const handleChange = useCallback(
    (...patches: PatchArg[]) => {
      onChange(PatchEvent.from(...patches))
    },
    [onChange]
  )

  const resolveInputComponent = useCallback(
    (_type: SchemaType) => {
      return defaultInputResolver(
        formBuilder.components?.inputs,
        formBuilder.resolveInputComponent,
        _type
      )
    },
    [formBuilder]
  )

  return (
    <FormBuilderProvider
      __internal_patchChannel={patchChannel}
      components={formBuilder.components}
      file={formBuilder.file}
      image={formBuilder.image}
      onBlur={onBlur}
      onChange={handleChange}
      onFocus={onFocus}
      onSelectFieldGroup={onSelectFieldGroup}
      onSetCollapsedFieldSet={onSetCollapsedFieldSet}
      onSetCollapsed={onSetCollapsed}
      renderField={renderField}
      resolveInputComponent={resolveInputComponent}
      resolvePreviewComponent={formBuilder.resolvePreviewComponent || previewResolver}
      schema={schema}
      value={value}
      type={type}
    >
      {children}
    </FormBuilderProvider>
  )
}
