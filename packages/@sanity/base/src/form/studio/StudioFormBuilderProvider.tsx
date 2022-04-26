import {Path, Schema, SchemaType} from '@sanity/types'
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

export function _prefixPath<T extends {path: Path}>(patch: T, path: Path): T {
  return {
    ...patch,
    path: [...path, ...patch.path],
  }
}

function _prefixAll(event: PatchEvent, path: Path): PatchEvent {
  return PatchEvent.from(event.patches.map((patch) => _prefixPath(patch, path)))
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
  renderField: RenderFieldCallback
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
    renderField,
    schema,
    value,
  } = props

  const {unstable_formBuilder: formBuilder} = useSource()

  const handleChange = useCallback(
    (path: Path, ...patches: PatchArg[]) => {
      onChange(_prefixAll(PatchEvent.from(...patches), path))
    },
    [onChange]
  )

  const resolveInputComponent = useCallback(
    (type: SchemaType) => {
      return defaultInputResolver(
        formBuilder.components?.inputs,
        formBuilder.resolveInputComponent,
        type
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
      onSetCollapsed={onSetCollapsed}
      renderField={renderField}
      resolveInputComponent={resolveInputComponent}
      resolvePreviewComponent={formBuilder.resolvePreviewComponent || previewResolver}
      schema={schema}
      value={value}
    >
      {children}
    </FormBuilderProvider>
  )
}
