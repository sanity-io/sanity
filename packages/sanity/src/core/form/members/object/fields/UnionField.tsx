import {ResetIcon} from '@sanity/icons'
import {useCallback, useEffect, useMemo, useRef} from 'react'

import {type DocumentFieldAction} from '../../../../config'
import {studioLocaleNamespace} from '../../../../i18n/localeNamespaces'
import {type FormPatch, PatchEvent, unset} from '../../../patch'
import {type FieldMember, type UnionFormNode} from '../../../store'
import {useDocumentFieldActions} from '../../../studio/contexts/DocumentFieldActions'
import {useFormCallbacks} from '../../../studio/contexts/FormCallbacks'
import {useParseErrorForPath} from '../../../studio/contexts/ParseErrors'
import {
  type RenderAnnotationCallback,
  type RenderArrayOfObjectsItemCallback,
  type RenderBlockCallback,
  type RenderFieldCallback,
  type RenderPreviewCallback,
  type RenderInputCallback,
  type UnionFieldProps,
  type UnionInputProps,
} from '../../../types'
import {pathToAnchorIdent} from '../../../utils/pathToAnchorIdent'
import {createDescriptionId} from '../../common/createDescriptionId'

/**
 * Responsible for creating inputProps and fieldProps for a standalone union field.
 *
 * @internal
 */
export function UnionField(props: {
  member: FieldMember<UnionFormNode>
  renderAnnotation?: RenderAnnotationCallback
  renderBlock?: RenderBlockCallback
  renderInput: RenderInputCallback
  renderField: RenderFieldCallback
  renderInlineBlock?: RenderBlockCallback
  renderItem: RenderArrayOfObjectsItemCallback
  renderPreview: RenderPreviewCallback
}) {
  const {
    member,
    renderAnnotation,
    renderBlock,
    renderInput,
    renderField,
    renderInlineBlock,
    renderItem,
    renderPreview,
  } = props

  const fieldActions = useDocumentFieldActions()
  const focusRef = useRef<{focus: () => void}>(undefined)

  const {
    onPathBlur,
    onPathFocus,
    onChange,
    onPathOpen,
    onSetPathCollapsed,
    onSetFieldSetCollapsed,
    onFieldGroupSelect,
  } = useFormCallbacks()

  const parseError = useParseErrorForPath(member.field.path)

  useEffect(() => {
    if (member.field.focused) {
      focusRef.current?.focus()
    }
  }, [member.field.focused])

  const handleBlur = useCallback(() => {
    onPathBlur(member.field.path)
  }, [member.field.path, onPathBlur])

  const handleFocus = useCallback(() => {
    onPathFocus(member.field.path)
  }, [member.field.path, onPathFocus])

  const handleChange = useCallback(
    (event: FormPatch | FormPatch[] | PatchEvent) => {
      onChange(PatchEvent.from(event).prefixAll(member.name))
    },
    [onChange, member.name],
  )

  const handleClearValue = useCallback(() => {
    onChange(PatchEvent.from(unset([member.name])))
  }, [member.name, onChange])

  const clearValueFieldAction = useMemo<DocumentFieldAction>(
    () => ({
      name: 'clearUnionValue',
      useAction() {
        return {
          type: 'action',
          icon: ResetIcon,
          title: 'Clear value',
          i18n: {title: {key: 'inputs.union.action.clear-value', ns: studioLocaleNamespace}},
          tone: 'critical',
          onAction: handleClearValue,
        }
      },
    }),
    [handleClearValue],
  )

  const actions = useMemo(() => {
    if (!member.field.value || member.field.readOnly) {
      return fieldActions
    }

    return [...fieldActions, clearValueFieldAction]
  }, [clearValueFieldAction, fieldActions, member.field.readOnly, member.field.value])

  const handleFocusChildPath = useCallback(
    (path: UnionInputProps['path']) => {
      onPathFocus(member.field.path.concat(path))
    },
    [member.field.path, onPathFocus],
  )

  const handleOpenField = useCallback(
    (fieldName: string) => {
      onPathOpen(member.field.path.concat(fieldName))
    },
    [onPathOpen, member.field.path],
  )

  const handleCloseField = useCallback(() => {
    onPathOpen(member.field.path)
  }, [onPathOpen, member.field.path])

  const handleCollapseField = useCallback(
    (fieldName: string) => {
      onSetPathCollapsed(member.field.path.concat(fieldName), true)
    },
    [onSetPathCollapsed, member.field.path],
  )

  const handleExpandField = useCallback(
    (fieldName: string) => {
      onSetPathCollapsed(member.field.path.concat(fieldName), false)
    },
    [onSetPathCollapsed, member.field.path],
  )

  const handleExpandFieldSet = useCallback(
    (fieldsetName: string) => {
      onSetFieldSetCollapsed(member.field.path.concat(fieldsetName), false)
    },
    [onSetFieldSetCollapsed, member.field.path],
  )

  const handleCollapseFieldSet = useCallback(
    (fieldsetName: string) => {
      onSetFieldSetCollapsed(member.field.path.concat(fieldsetName), true)
    },
    [onSetFieldSetCollapsed, member.field.path],
  )

  const handleSelectFieldGroup = useCallback(
    (groupName: string) => {
      onFieldGroupSelect(member.field.path, groupName)
    },
    [onFieldGroupSelect, member.field.path],
  )

  const elementProps = useMemo(
    (): UnionInputProps['elementProps'] => ({
      'onBlur': handleBlur,
      'onFocus': handleFocus,
      'id': member.field.id,
      'ref': focusRef,
      'aria-describedby': createDescriptionId(member.field.id, member.field.schemaType.description),
      'style': {
        anchorName: pathToAnchorIdent('input', member.field.path),
      },
    }),
    [
      handleBlur,
      handleFocus,
      member.field.id,
      member.field.schemaType.description,
      member.field.path,
    ],
  )

  const validation = useMemo(() => {
    if (!parseError) return member.field.validation
    const nonErrors = member.field.validation.filter((item) => item.level !== 'error')
    return [{level: 'error' as const, message: parseError, path: member.field.path}, ...nonErrors]
  }, [member.field.validation, member.field.path, parseError])

  const inputProps = useMemo((): Omit<UnionInputProps, 'renderDefault'> => {
    const validationError =
      validation
        .filter((item) => item.level === 'error')
        .map((item) => item.message)
        .join('\n') || undefined

    return {
      value: member.field.value,
      compareValue: member.field.compareValue,
      __unstable_computeDiff: member.field.__unstable_computeDiff,
      readOnly: member.field.readOnly,
      selectedMember: member.field.selectedMember,
      schemaType: member.field.schemaType,
      changed: member.field.changed,
      hasUpstreamVersion: member.field.hasUpstreamVersion,
      id: member.field.id,
      path: member.field.path,
      focused: member.field.focused,
      level: member.field.level,
      onChange: handleChange,
      validation,
      presence: member.field.presence,
      validationError,
      elementProps,
      displayInlineChanges: member.field.displayInlineChanges ?? false,
      onFieldCollapse: handleCollapseField,
      onFieldExpand: handleExpandField,
      onFieldSetCollapse: handleCollapseFieldSet,
      onFieldSetExpand: handleExpandFieldSet,
      onFieldGroupSelect: handleSelectFieldGroup,
      onPathFocus: handleFocusChildPath,
      onFieldOpen: handleOpenField,
      onFieldClose: handleCloseField,
      renderAnnotation,
      renderBlock,
      renderInput,
      renderField,
      renderInlineBlock,
      renderItem,
      renderPreview,
    }
  }, [
    member.field.displayInlineChanges,
    member.field.value,
    member.field.compareValue,
    member.field.__unstable_computeDiff,
    member.field.readOnly,
    member.field.selectedMember,
    member.field.schemaType,
    member.field.changed,
    member.field.hasUpstreamVersion,
    member.field.id,
    member.field.path,
    member.field.focused,
    member.field.level,
    validation,
    member.field.presence,
    handleChange,
    elementProps,
    handleCollapseField,
    handleExpandField,
    handleCollapseFieldSet,
    handleExpandFieldSet,
    handleSelectFieldGroup,
    handleFocusChildPath,
    handleOpenField,
    handleCloseField,
    renderAnnotation,
    renderBlock,
    renderInput,
    renderField,
    renderInlineBlock,
    renderItem,
    renderPreview,
  ])

  return (
    <RenderField
      actions={actions}
      changed={member.field.changed}
      description={member.field.schemaType.description}
      index={member.index}
      inputId={member.field.id}
      inputProps={inputProps as UnionInputProps}
      level={member.field.level}
      name={member.name}
      path={member.field.path}
      presence={member.field.presence}
      schemaType={member.field.schemaType}
      title={member.field.schemaType.title}
      validation={validation}
      value={member.field.value}
      render={renderField}
    >
      <RenderInput {...inputProps} render={renderInput} />
    </RenderField>
  )
}

// The RenderInput and RenderField wrappers workaround the strict refs checks in React Compiler
function RenderInput({
  render,
  ...props
}: Omit<UnionInputProps, 'renderDefault'> & {
  render: RenderInputCallback
}) {
  return render(props)
}

function RenderField({
  render,
  ...props
}: Omit<UnionFieldProps, 'renderDefault'> & {
  render: RenderFieldCallback
}) {
  return render(props)
}
