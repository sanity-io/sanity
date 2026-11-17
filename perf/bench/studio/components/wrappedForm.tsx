import {
  type BlockAnnotationProps,
  type BlockProps,
  type FieldProps,
  type InputProps,
  type ItemProps,
  type PreviewProps,
} from 'sanity'

import {markRender} from './benchRenderMark'

/**
 * Config-level form.components wrapping every slot around renderDefault —
 * the "customer wraps everything" pattern (ported from
 * dev/test-studio/components/formComponents.tsx, minus @sanity/ui so the
 * bench adds no dependency). Each wrapper marks its render for settle mode.
 */

export function WrappedInput(props: InputProps) {
  markRender('wrappedForm.input')
  return <div data-testid="bench-wrapped-input">{props.renderDefault(props)}</div>
}

export function WrappedField(props: FieldProps) {
  markRender('wrappedForm.field')
  return <div data-testid="bench-wrapped-field">{props.renderDefault(props)}</div>
}

export function WrappedItem(props: ItemProps) {
  markRender('wrappedForm.item')
  return <div data-testid="bench-wrapped-item">{props.renderDefault(props)}</div>
}

export function WrappedBlock(props: BlockProps) {
  markRender('wrappedForm.block')
  return <div data-testid="bench-wrapped-block">{props.renderDefault(props)}</div>
}

export function WrappedInlineBlock(props: BlockProps) {
  markRender('wrappedForm.inlineBlock')
  return (
    <span data-testid="bench-wrapped-inline-block" style={{display: 'inline-block'}}>
      {props.renderDefault(props)}
    </span>
  )
}

export function WrappedAnnotation(props: BlockAnnotationProps) {
  markRender('wrappedForm.annotation')
  return (
    <span data-testid="bench-wrapped-annotation" style={{display: 'inline'}}>
      {props.renderDefault(props)}
    </span>
  )
}

export function WrappedPreview(props: PreviewProps) {
  markRender('wrappedForm.preview')
  return <div data-testid="bench-wrapped-preview">{props.renderDefault(props)}</div>
}
