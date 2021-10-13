import {omit} from 'lodash'
import {PaneNode, RouterPaneGroup} from './types'
import {exclusiveParams} from './contexts/paneRouter'
import {LOADING_PANE} from './constants'

interface PaneData {
  active: boolean
  childItemId: string | null
  groupIndex: number
  index: number
  itemId: string
  key: string
  pane: PaneNode | typeof LOADING_PANE
  params: Record<string, string>
  path: string
  payload: unknown
  selected: boolean
  siblingIndex: number
}

// eslint-disable-next-line complexity
export function getPanes(
  resolvedPanes: Array<PaneNode | typeof LOADING_PANE>,
  routerPanes: RouterPaneGroup[]
): PaneData[] {
  let path = ''
  let paneIndex = 0

  const ret: PaneData[] = []

  const paneKeys = routerPanes.reduce<string[]>(
    (ids, group) => ids.concat(group.map((sibling) => sibling.id)),
    ['root']
  )

  const paneGroups: RouterPaneGroup[] = [[{id: 'root'}]].concat(routerPanes || [])

  const groupsLen = paneGroups.length

  for (let groupIndex = 0; groupIndex < groupsLen; groupIndex += 1) {
    const group = paneGroups[groupIndex]
    const siblingsLen = group.length

    for (let siblingIndex = 0; siblingIndex < siblingsLen; siblingIndex += 1) {
      const sibling = group[siblingIndex]
      const pane = resolvedPanes[paneIndex]

      if (pane) {
        path += `;${(typeof pane === 'object' && pane.id) || `[${paneIndex}]`}`

        const duplicate = siblingIndex > 0 && sibling.id === group[0].id
        const itemId = paneKeys[paneIndex] || 'root'
        const rootParams = omit(group[0].params || {}, exclusiveParams)
        const nextGroup = paneGroups[groupIndex + 1]

        ret.push({
          active: groupIndex === groupsLen - 2,
          childItemId: (nextGroup && nextGroup[0].id) || null,
          index: paneIndex,
          itemId,
          groupIndex,
          key: `${(typeof pane === 'object' && pane.type) || 'unknown'}-${itemId}-${siblingIndex}`,
          pane,
          params: {...rootParams, ...(sibling.params || {})},
          path,
          payload: duplicate ? sibling.payload || group[0].payload : sibling.payload,
          selected: paneIndex === resolvedPanes.length - 1,
          siblingIndex,
        })
      }

      paneIndex += 1
    }
  }

  return ret
}
