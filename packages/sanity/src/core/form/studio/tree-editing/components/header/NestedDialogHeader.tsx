import {type Path} from '@sanity/types'
import {Box, Flex, Text} from '@sanity/ui'

import {pathToString} from '../../../../../field/paths/helpers'
import {useTranslation} from '../../../../../i18n/hooks/useTranslation'
import {type PatchEvent} from '../../../../patch/PatchEvent'
import {type FormPatch} from '../../../../patch/types'
import {type TreeEditingState} from '../../utils'
import {TreeEditingBreadcrumbs} from '../breadcrumbs/TreeEditingBreadcrumbs'
import {NestedDialogActions} from './NestedDialogActions'

interface NestedDialogHeaderProps {
  treeState: TreeEditingState
  onHandlePathSelect: (path: Path) => void
  rootOnChange?: (patch: FormPatch | FormPatch[] | PatchEvent) => void
  readOnly?: boolean
}

function isPathInPTEField(path: Path): boolean {
  // Portable Text text content lives under the 'children' segment
  return path.some((segment) => typeof segment === 'string' && segment === 'children')
}

export function NestedDialogHeader(props: NestedDialogHeaderProps) {
  const {treeState, onHandlePathSelect, rootOnChange, readOnly} = props
  const {relativePath, siblings} = treeState
  const {t} = useTranslation()

  const parentPath = relativePath.slice(0, -1)
  const parentPathString = pathToString(parentPath)

  const siblingInfo = siblings.get(parentPathString)
  const total = siblingInfo?.count
  const currentIndex = siblingInfo?.index

  return (
    <Flex align="center" gap={2} justify="space-between">
      <TreeEditingBreadcrumbs
        items={treeState.breadcrumbs}
        onPathSelect={onHandlePathSelect}
        selectedPath={treeState.relativePath}
      />
      <Flex align="center" gap={2}>
        {total && total >= 1 && (
          <Box padding={2}>
            <Text style={{whiteSpace: 'nowrap'}} muted size={1}>
              {t('nested-object-editing-dialog.header.sibling-count', {
                count: currentIndex,
                total,
              })}
            </Text>
          </Box>
        )}
        {!isPathInPTEField(relativePath) && (
          <NestedDialogActions
            relativePath={relativePath}
            rootOnChange={rootOnChange!}
            readOnly={!!readOnly}
            onHandlePathSelect={onHandlePathSelect}
          />
        )}
      </Flex>
    </Flex>
  )
}
