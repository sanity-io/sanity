import React, {memo, useCallback, useMemo} from 'react'
import {isEqual, startsWith, trimLeft} from '@sanity/util/paths'
import {isKeySegment, Path} from '@sanity/types'
import {FieldMember} from '../store'
import {
  ArrayOfObjectsInputProps,
  ObjectInputProps,
  RenderAnnotationCallback,
  RenderArrayOfObjectsItemCallback,
  RenderBlockCallback,
  RenderFieldCallback,
  RenderInputCallback,
  RenderPreviewCallback,
} from '../types'
import {isArrayInputProps, isObjectInputProps} from '../utils/asserters'
import {MemberField, ArrayOfObjectsItem, MemberItemError} from '../members'

const pass = ({children}: {children: React.ReactNode}) => children

/** @internal */
export type FormInputAbsolutePathArg = {absolutePath: Path}

/** @internal */
export type FormInputRelativePathArg = {relativePath: Path}

function hasAbsolutePath(
  a: FormInputAbsolutePathArg | FormInputRelativePathArg,
): a is FormInputAbsolutePathArg {
  return 'absolutePath' in a
}

/** @internal */
export const FormInput = memo(function FormInput(
  props: (ArrayOfObjectsInputProps | ObjectInputProps) &
    (FormInputRelativePathArg | FormInputAbsolutePathArg) & {
      /**
       * Whether to include the field around the input. Defaults to false
       */
      includeField?: boolean
    },
) {
  const absolutePath = useMemo(() => {
    return hasAbsolutePath(props) ? props.absolutePath : props.path.concat(props.relativePath)
  }, [props])

  // TODO: Refactor this at some point in Studio v4
  //
  // renderBlock, renderInlineBlock and renderAnnotation
  // was introduced as optional InputProps after the initial
  // release of v3, in order to not introduce breaking changes.
  // They are still required in this inner internal component.
  const nullRender = useCallback(() => <>Missing destination render function</>, [])

  return (
    <FormInputInner
      {...props}
      absolutePath={absolutePath}
      destinationRenderAnnotation={props.renderAnnotation || nullRender}
      destinationRenderBlock={props.renderBlock || nullRender}
      destinationRenderField={props.renderField}
      destinationRenderInlineBlock={props.renderInlineBlock || nullRender}
      destinationRenderInput={props.renderInput}
      destinationRenderItem={props.renderItem}
      destinationRenderPreview={props.renderPreview}
    />
  )
})

/**
 * An input that takes input props for object or array and renders an input for a given sub-path
 */
const FormInputInner = memo(function FormInputInner(
  props: (ArrayOfObjectsInputProps | ObjectInputProps) & {
    absolutePath: Path
    includeField?: boolean
    includeItem?: boolean
    destinationRenderAnnotation: RenderAnnotationCallback
    destinationRenderBlock: RenderBlockCallback
    destinationRenderField: RenderFieldCallback
    destinationRenderInlineBlock: RenderBlockCallback
    destinationRenderInput: RenderInputCallback
    destinationRenderItem: RenderArrayOfObjectsItemCallback
    destinationRenderPreview: RenderPreviewCallback
  },
) {
  const {
    absolutePath,
    destinationRenderAnnotation,
    destinationRenderBlock,
    destinationRenderField,
    destinationRenderInlineBlock,
    destinationRenderInput,
    destinationRenderItem,
    destinationRenderPreview,
  } = props

  const renderInput: RenderInputCallback = useCallback(
    (inputProps) => {
      const isDestinationReached =
        isEqual(inputProps.path, absolutePath) || startsWith(absolutePath, inputProps.path)
      if (isDestinationReached) {
        // we have reached the destination node and can now render with the passed renderInput
        return destinationRenderInput(inputProps)
      }
      if (!isObjectInputProps(inputProps) && !isArrayInputProps(inputProps)) {
        throw new Error(
          `Expected either object input props or array input props for: ${JSON.stringify(
            inputProps.path,
          )}`,
        )
      }
      // we have not yet reached the destination path, so we'll continue recurse until we get there
      return (
        <FormInputInner
          {...inputProps}
          absolutePath={absolutePath}
          destinationRenderAnnotation={destinationRenderAnnotation}
          destinationRenderBlock={destinationRenderBlock}
          destinationRenderInput={destinationRenderInput}
          destinationRenderItem={destinationRenderItem}
          destinationRenderField={destinationRenderField}
          destinationRenderInlineBlock={destinationRenderInlineBlock}
          destinationRenderPreview={destinationRenderPreview}
        />
      )
    },
    [
      absolutePath,
      destinationRenderAnnotation,
      destinationRenderBlock,
      destinationRenderField,
      destinationRenderInlineBlock,
      destinationRenderInput,
      destinationRenderItem,
      destinationRenderPreview,
    ],
  )

  const renderField: RenderFieldCallback = useCallback(
    (fieldProps) => {
      // we want to render the field around the input if either of these are true:
      // 1. we have reached the destination path and the `includeField`-prop is passed as true
      // 2. we are currently at a node somewhere below/inside the destination path
      const shouldRenderField =
        startsWith(absolutePath, fieldProps.path) &&
        (props.includeField || !isEqual(absolutePath, fieldProps.path))
      return shouldRenderField ? destinationRenderField(fieldProps) : pass(fieldProps)
    },
    [absolutePath, destinationRenderField, props.includeField],
  )

  const renderItem: RenderArrayOfObjectsItemCallback = useCallback(
    (itemProps) => {
      // we want to render the item around the input if either of these are true:
      // 1. we have reached the destination path and the `includeItem`-prop is passed as true
      // 2. we are currently at a node somewhere below/inside the destination path
      const shouldRenderField =
        startsWith(absolutePath, itemProps.path) &&
        (props.includeItem || !isEqual(absolutePath, itemProps.path))
      return shouldRenderField ? destinationRenderItem(itemProps) : pass(itemProps)
    },
    [absolutePath, destinationRenderItem, props.includeItem],
  )

  const renderBlock: RenderBlockCallback = useCallback(
    (blockProps) => {
      const shouldRenderBlock =
        startsWith(absolutePath, blockProps.path) &&
        (props.includeItem || !isEqual(absolutePath, blockProps.path))
      return shouldRenderBlock ? destinationRenderBlock(blockProps) : pass(blockProps)
    },
    [absolutePath, destinationRenderBlock, props.includeItem],
  )

  const renderInlineBlock: RenderBlockCallback = useCallback(
    (blockProps) => {
      const shouldRenderInlineBlock =
        startsWith(absolutePath, blockProps.path) &&
        (props.includeItem || !isEqual(absolutePath, blockProps.path))
      return shouldRenderInlineBlock ? destinationRenderInlineBlock(blockProps) : pass(blockProps)
    },
    [absolutePath, destinationRenderInlineBlock, props.includeItem],
  )

  const renderAnnotation: RenderAnnotationCallback = useCallback(
    (annotationProps) => {
      const shouldRenderAnnotation =
        startsWith(absolutePath, annotationProps.path) &&
        (props.includeItem || !isEqual(absolutePath, annotationProps.path))
      return shouldRenderAnnotation
        ? destinationRenderAnnotation(annotationProps)
        : pass(annotationProps)
    },
    [absolutePath, destinationRenderAnnotation, props.includeItem],
  )

  if (isArrayInputProps(props)) {
    const childPath = trimLeft(props.path, absolutePath)

    const itemMember = props.members.find(
      (member) =>
        member.kind == 'item' && isKeySegment(childPath[0]) && member.key === childPath[0]._key,
    )

    if (!itemMember) {
      const relativePath = trimLeft(props.path, absolutePath)
      const key = (relativePath[0] as any)._key
      return (
        <div>
          No array item with _key <code>"{key}"</code> found at path {JSON.stringify(props.path)}
        </div>
      )
    }
    if (itemMember.kind === 'error') {
      return <MemberItemError member={itemMember} />
    }
    return (
      <ArrayOfObjectsItem
        member={itemMember}
        renderAnnotation={renderAnnotation}
        renderBlock={renderBlock}
        renderInput={renderInput}
        renderField={renderField}
        renderInlineBlock={renderInlineBlock}
        renderItem={renderItem}
        renderPreview={destinationRenderPreview}
      />
    )
  }

  if (isObjectInputProps(props)) {
    const childPath = trimLeft(props.path, absolutePath)
    const fieldMember = props.members.find(
      (member): member is FieldMember => member.kind == 'field' && childPath[0] === member.name,
    )

    if (!fieldMember) {
      const fieldName = childPath[0]
      return (
        <div>
          Field {JSON.stringify(fieldName)} not found among members – please verify that it's both
          defined in the schema and that it has not been conditionally hidden.
        </div>
      )
    }

    return (
      <MemberField
        member={fieldMember}
        renderAnnotation={renderAnnotation}
        renderBlock={renderBlock}
        renderInput={renderInput}
        renderInlineBlock={renderInlineBlock}
        renderField={renderField}
        renderItem={renderItem}
        renderPreview={destinationRenderPreview}
      />
    )
  }
  throw new Error('FormInput can only be used with arrays or objects')
})
