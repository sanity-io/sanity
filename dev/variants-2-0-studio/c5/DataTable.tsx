import {ArrowDownIcon} from '@sanity/icons/ArrowDown'
import {ArrowUpIcon} from '@sanity/icons/ArrowUp'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {Button as SortHeaderButton, Card, Flex, Text} from '@sanity/ui' // the header sort button needs padding 1, which the Studio Button does not offer
import {Button} from '../../../packages/sanity/src/ui-components/button/Button'
import {type ReactNode, useMemo, useState} from 'react'

// Ported from the Storybook Variants 2.0 exploration (table/InventoryTable.tsx, ae8ed6f9e7): a table from Sanity UI
// rows, sticky first column and header, sortable columns. LIVE: rows can be clicked and one can be selected.

export interface Column<T> {
  key: string
  title: string
  /** Replaces the title in the header (for example a select-all checkbox). */
  header?: ReactNode
  width: number
  render: (row: T) => ReactNode
  sort?: (a: T, b: T) => number
}

export interface RowGroup<T> {
  id: string
  title: string
  rows: T[]
  collapsed: boolean
  onToggle: () => void
}

export function DataTable<T extends {id: string}>(props: {
  columns: readonly Column<T>[]
  rows: readonly T[]
  testId: string
  height?: number
  selectedId?: string | null
  onRowClick?: (row: T) => void
  empty?: string
  /** Rows in collapsible groups (a header row with the title and the count); `rows` is then only the flat list. */
  groups?: RowGroup<T>[]
}) {
  const {columns, rows, testId, height = 520, selectedId, onRowClick, empty, groups} = props
  const [sort, setSort] = useState<{key: string; dir: 1 | -1} | null>(null)
  const sorted = useMemo(() => {
    const column = columns.find((c) => c.key === sort?.key)
    if (!column?.sort || !sort) return rows
    return [...rows].sort((a, b) => column.sort!(a, b) * sort.dir)
  }, [columns, rows, sort])
  const total = columns.reduce((n, c) => n + c.width, 0)

  const cell = (column: Column<T>, index: number, child: ReactNode, header?: boolean) => (
    <Card
      key={column.key}
      padding={3}
      style={{
        flex: 'none',
        left: index === 0 ? 0 : undefined,
        position: index === 0 ? 'sticky' : undefined,
        width: column.width,
        zIndex: index === 0 ? 1 : undefined,
      }}
      tone={header ? 'transparent' : 'inherit'}
    >
      {child}
    </Card>
  )

  return (
    <Card border data-testid={testId} radius={2} style={{maxHeight: height, overflow: 'auto'}}>
      <div style={{minWidth: total}}>
        <Flex style={{position: 'sticky', top: 0, zIndex: 2}}>
          {columns.map((column, i) =>
            cell(
              column,
              i,
              column.header ? (
                column.header
              ) : column.sort ? (
                <SortHeaderButton
                  iconRight={sort?.key === column.key ? (sort.dir === 1 ? ArrowUpIcon : ArrowDownIcon) : undefined}
                  mode="bleed"
                  onClick={() =>
                    setSort(
                      sort?.key === column.key
                        ? sort.dir === 1
                          ? {key: column.key, dir: -1}
                          : null
                        : {key: column.key, dir: 1},
                    )
                  }
                  padding={1}
                  text={column.title}
                />
              ) : (
                <Text muted size={1} weight="medium">
                  {column.title}
                </Text>
              ),
              true,
            ),
          )}
        </Flex>
        {sorted.length === 0 && empty ? (
          <Card borderTop padding={3}>
            <Text muted size={1}>
              {empty}
            </Text>
          </Card>
        ) : null}
        {(groups ?? [{id: '', title: '', rows: sorted, collapsed: false, onToggle: () => undefined}]).map((group) => (
          <div key={group.id} data-testid={groups ? `${testId}-group-${group.id}` : undefined}>
            {groups ? (
              <Card
                as="button"
                borderTop
                onClick={group.onToggle}
                padding={2}
                style={{cursor: 'pointer', textAlign: 'left', width: '100%'}}
                tone="transparent"
              >
                <Flex align="center" gap={2} style={{position: 'sticky', left: 0, width: 'max-content'}}>
                  <Text size={1}>{group.collapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}</Text>
                  <Text size={1} weight="medium">
                    {group.title}
                  </Text>
                  <Text muted size={1}>
                    {group.rows.length}
                  </Text>
                </Flex>
              </Card>
            ) : null}
            {group.collapsed
              ? null
              : group.rows.map((row) => (
                  <Card
                    borderTop
                    data-testid={`${testId}-row-${row.id}`}
                    key={row.id}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    selected={row.id === selectedId}
                    style={onRowClick ? {cursor: 'pointer'} : undefined}
                  >
                    <Flex>{columns.map((column, i) => cell(column, i, column.render(row)))}</Flex>
                  </Card>
                ))}
          </div>
        ))}
      </div>
    </Card>
  )
}
