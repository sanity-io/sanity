import {Box, Stack} from '@sanity/ui'
import {
  Fragment,
  type HTMLAttributes,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {DiffContext} from 'sanity/_singletons'

import {useDocumentOperation} from '../../../hooks'
import {usePerspective} from '../../../perspective/usePerspective'
import {useDocumentPairPermissions} from '../../../store'
import {pathsAreEqual} from '../../paths'
import {type GroupChangeNode} from '../../types'
import {isPTSchemaType} from '../../types/portableText/diff'
import {undoChange} from '../changes/undoChange'
import {isFieldChange} from '../helpers'
import {useDocumentChange} from '../hooks'
import {ChangeBreadcrumb} from './ChangeBreadcrumb'
import {ChangeResolver} from './ChangeResolver'
import {ChangeListWrapper, GroupChangeContainer} from './GroupChange.styled'
import {RevertChangesButton} from './RevertChangesButton'
import {RevertChangesConfirmDialog} from './RevertChangesConfirmDialog'

/** @internal */
export function GroupChange(
  props: {
    change: GroupChangeNode
    readOnly?: boolean
    hidden?: boolean
  } & HTMLAttributes<HTMLDivElement>,
): React.JSX.Element | null {
  const {change: group, readOnly, hidden, ...restProps} = props
  const {titlePath, changes, path: groupPath} = group
  const {path: diffPath} = useContext(DiffContext)
  const {
    documentId,
    schemaType,
    FieldWrapper = Fragment,
    rootDiff,
    isComparingCurrent,
  } = useDocumentChange()

  const isPortableText = changes.every(
    (change) => isFieldChange(change) && isPTSchemaType(change.schemaType),
  )

  const isNestedInDiff = pathsAreEqual(diffPath, groupPath)
  const [revertButtonElement, _setRevertButtonElement] = useState<HTMLButtonElement | null>(null)
  const setRevertButtonElement = (element: HTMLButtonElement | null) => {
    /**
     * The startTransition wrapper here is to avoid an issue when on React 18 where this error can happen:
     * \>Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.
     * This doesn't happen on React 19 due to automatic batching of all state updates, the startTransition wrapper here gives a type of batching for 18 users in a way that still works with 19.
     */
    startTransition(() => _setRevertButtonElement(element))
  }
  const isRevertButtonHovered = useHover<HTMLButtonElement>(revertButtonElement)

  const {selectedReleaseId} = usePerspective()
  const docOperations = useDocumentOperation(documentId, schemaType.name, selectedReleaseId)
  const [confirmRevertOpen, setConfirmRevertOpen] = useState(false)

  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id: documentId,
    type: schemaType.name,
    permission: 'update',
  })

  const handleRevertChanges = useCallback(() => {
    undoChange(group, rootDiff, docOperations)
    setConfirmRevertOpen(false)
  }, [group, rootDiff, docOperations])

  const handleRevertChangesConfirm = useCallback(() => {
    setConfirmRevertOpen(true)
  }, [])

  const closeRevertChangesConfirmDialog = useCallback(() => {
    setConfirmRevertOpen(false)
  }, [])

  const content = useMemo(
    () =>
      hidden ? null : (
        <>
          <Stack
            space={1}
            as={GroupChangeContainer}
            data-ui="group-change-content"
            data-revert-group-hover={isRevertButtonHovered ? '' : undefined}
            data-portable-text={isPortableText ? '' : undefined}
          >
            <Stack as={ChangeListWrapper} space={5} data-ui="group-change-list">
              {changes.map((change) => (
                <ChangeResolver
                  key={change.key}
                  change={change}
                  readOnly={readOnly}
                  hidden={hidden}
                  // If the path of the nested change is more than two levels deep, we want to add a wrapper
                  // with the parent path, for the change indicator to be shown.
                  addParentWrapper={change.path.length - group.path.length > 1}
                />
              ))}
            </Stack>
            {isComparingCurrent && !isPermissionsLoading && permissions?.granted && (
              <Box>
                <RevertChangesButton
                  changeCount={changes.length}
                  onClick={handleRevertChangesConfirm}
                  ref={setRevertButtonElement}
                  selected={confirmRevertOpen}
                  disabled={readOnly}
                  data-testid={`group-change-revert-button-${group.fieldsetName}`}
                />
              </Box>
            )}
          </Stack>

          <RevertChangesConfirmDialog
            open={confirmRevertOpen}
            onConfirm={handleRevertChanges}
            onCancel={closeRevertChangesConfirmDialog}
            changeCount={changes.length}
            referenceElement={revertButtonElement}
          />
        </>
      ),
    [
      changes,
      confirmRevertOpen,
      group.fieldsetName,
      group.path.length,
      handleRevertChangesConfirm,
      hidden,
      isComparingCurrent,
      isPermissionsLoading,
      isPortableText,
      isRevertButtonHovered,
      permissions?.granted,
      readOnly,
      handleRevertChanges,
      closeRevertChangesConfirmDialog,
      revertButtonElement,
    ],
  )

  const isPortableTextGroupArray =
    group.schemaType?.jsonType === 'array' &&
    group.schemaType.of.some((ofType) => ofType.name === 'block')

  return hidden ? null : (
    <Stack space={1} {...restProps}>
      <ChangeBreadcrumb titlePath={titlePath} />
      {isNestedInDiff || isPortableTextGroupArray ? (
        content
      ) : (
        <FieldWrapper hasRevertHover={isRevertButtonHovered} path={groupPath}>
          {content}
        </FieldWrapper>
      )}
    </Stack>
  )
}

function useHover<T extends HTMLElement>(node: T | null): boolean {
  const [value, setValue] = useState(false)

  useEffect(() => {
    if (!node) {
      return undefined
    }

    const handleMouseOver = () => startTransition(() => setValue(true))
    const handleMouseOut = () => startTransition(() => setValue(false))

    node.addEventListener('mouseover', handleMouseOver)
    node.addEventListener('mouseout', handleMouseOut)

    return () => {
      node.removeEventListener('mouseover', handleMouseOver)
      node.removeEventListener('mouseout', handleMouseOut)
    }
  }, [node])

  return value
}
