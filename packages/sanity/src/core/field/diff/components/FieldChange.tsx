import {type ObjectSchemaType, type Path} from '@sanity/types'
import {Stack} from '@sanity/ui'
import {Fragment, type HTMLAttributes, useCallback, useMemo, useRef, useState} from 'react'
import {DiffContext} from 'sanity/_singletons'

import {useDocumentOperation} from '../../../hooks'
import {useTranslation} from '../../../i18n'
import {usePerspective} from '../../../perspective/usePerspective'
import {useDocumentPairPermissions} from '../../../store'
import {type FieldChangeNode} from '../../types'
import {undoChange} from '../changes/undoChange'
import {useDocumentChange} from '../hooks'
import {ChangeBreadcrumb} from './ChangeBreadcrumb'
import {DiffErrorBoundary} from './DiffErrorBoundary'
import {DiffInspectWrapper} from './DiffInspectWrapper'
import {FallbackDiff} from './FallbackDiff'
import {DiffBorder, FieldChangeContainer} from './FieldChange.styled'
import {RevertChangesButton} from './RevertChangesButton'
import {RevertChangesConfirmDialog} from './RevertChangesConfirmDialog'
import {ValueError} from './ValueError'

const ParentWrapper = ({
  children,
  path,
  hasRevertHover,
  wrap,
}: {
  children: React.ReactNode
  path: Path
  hasRevertHover: boolean
  wrap: boolean
}) => {
  const {FieldWrapper = Fragment} = useDocumentChange()

  if (wrap) {
    let lastArrayIndex = 0
    for (let i = 0; i < path.length; i++) {
      if (typeof path[i] !== 'string') {
        lastArrayIndex = i
      }
    }

    return (
      <FieldWrapper path={path.slice(0, lastArrayIndex + 1)} hasRevertHover={hasRevertHover}>
        {children}
      </FieldWrapper>
    )
  }
  return children
}

/** @internal */
export function FieldChange(
  props: {
    change: FieldChangeNode
    readOnly?: boolean
    hidden?: boolean
    addParentWrapper?: boolean
  } & HTMLAttributes<HTMLDivElement>,
) {
  const {change, hidden, readOnly, addParentWrapper, ...restProps} = props
  const DiffComponent = change.diffComponent || FallbackDiff
  const {
    documentId,
    schemaType,
    rootDiff,
    isComparingCurrent,
    FieldWrapper = Fragment,
  } = useDocumentChange()
  const {selectedReleaseId} = usePerspective()
  const ops = useDocumentOperation(documentId, schemaType.name, selectedReleaseId)
  const [confirmRevertOpen, setConfirmRevertOpen] = useState(false)
  const [revertHovered, setRevertHovered] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const {t} = useTranslation()

  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id: documentId,
    type: schemaType.name,
    permission: 'update',
  })

  const handleRevertChanges = useCallback(() => {
    undoChange(change, rootDiff, ops)
    setConfirmRevertOpen(false)
  }, [change, rootDiff, ops])

  const handleRevertChangesConfirm = useCallback(() => {
    setConfirmRevertOpen(true)
  }, [])

  const closeRevertChangesConfirmDialog = useCallback(() => {
    setConfirmRevertOpen(false)
  }, [])

  const handleRevertButtonMouseEnter = useCallback(() => {
    setRevertHovered(true)
  }, [])

  const handleRevertButtonMouseLeave = useCallback(() => {
    setRevertHovered(false)
  }, [])

  const isArray =
    change.parentSchema?.jsonType === 'array' &&
    // And it's not a PortableText array
    !change.parentSchema.of.some((ofType) => ofType.type?.name === 'block')

  /* this condition is required in order to avoid situations where an array change has happened
   * but not necessarily an array item change. E.g. when adding one new item to an array, the changes pane
   * would be able to identify that a new item was added but not what array it belonged to (because the change path
   * is only related to the item itself, not the array)
   */
  const fieldPath = isArray ? change.path.slice(0, -1) : change.path

  const value = useMemo(() => ({path: change.path}), [change.path])

  const content = useMemo(
    () =>
      hidden ? null : (
        <>
          <Stack gap={1} as={FieldChangeContainer} {...restProps}>
            {change.showHeader && <ChangeBreadcrumb change={change} titlePath={change.titlePath} />}
            <ParentWrapper
              path={fieldPath}
              hasRevertHover={revertHovered}
              wrap={Boolean(addParentWrapper)}
            >
              <FieldWrapper path={fieldPath} hasRevertHover={revertHovered}>
                <DiffInspectWrapper
                  change={change}
                  as={DiffBorder}
                  data-revert-field-hover={revertHovered ? '' : undefined}
                  data-error={change.error ? '' : undefined}
                  data-revert-all-hover
                  data-ui="field-diff-inspect-wrapper"
                >
                  {change.error ? (
                    <ValueError error={change.error} />
                  ) : (
                    <DiffErrorBoundary t={t}>
                      <DiffContext.Provider value={value}>
                        <DiffComponent
                          diff={change.diff}
                          schemaType={change.schemaType as ObjectSchemaType}
                        />
                      </DiffContext.Provider>
                    </DiffErrorBoundary>
                  )}

                  {isComparingCurrent && !isPermissionsLoading && permissions?.granted && (
                    <RevertChangesButton
                      changeCount={1}
                      onClick={handleRevertChangesConfirm}
                      onMouseEnter={handleRevertButtonMouseEnter}
                      onMouseLeave={handleRevertButtonMouseLeave}
                      selected={confirmRevertOpen}
                      disabled={readOnly}
                      ref={buttonRef}
                      data-testid={`single-change-revert-button-${change?.key}`}
                    />
                  )}
                </DiffInspectWrapper>
              </FieldWrapper>
            </ParentWrapper>
          </Stack>

          <RevertChangesConfirmDialog
            open={confirmRevertOpen}
            onConfirm={handleRevertChanges}
            onCancel={closeRevertChangesConfirmDialog}
            changeCount={1}
            referenceElement={buttonRef.current}
          />
        </>
      ),
    [
      hidden,
      change,
      fieldPath,
      revertHovered,
      addParentWrapper,
      FieldWrapper,
      restProps,
      t,
      value,
      DiffComponent,
      isComparingCurrent,
      isPermissionsLoading,
      permissions?.granted,
      handleRevertChangesConfirm,
      handleRevertButtonMouseEnter,
      handleRevertButtonMouseLeave,
      readOnly,
      confirmRevertOpen,
      handleRevertChanges,
      closeRevertChangesConfirmDialog,
    ],
  )

  return content
}
