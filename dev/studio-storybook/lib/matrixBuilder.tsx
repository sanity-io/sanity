/**
 * A local port of sanity-ui's storybook matrix helpers
 * (apps/storybook/stories/helpers/{matrixBuilder,rowBuilder}.tsx). It lives here rather
 * than importing across repos so the Studio storybook stays self-contained — the upstream
 * design-system storybook is not a dependency of this package.
 *
 * `matrixBuilder` lays a primitive out on a two-axis grid (e.g. tone × state), the canonical
 * way to read every combination of a primitive's styles at once. `SchemeCompare` renders the
 * SAME subtree twice — once in each color scheme — inside two local `Card scheme=` scopes, so
 * a story can show light and dark side by side even though the global theme toggle is a single
 * scheme at a time. `PxCaption` is the shared measure-labeled caption used under size ladders.
 */

import {Card, Flex, Grid, Stack, Text} from '@sanity/ui'
import {type ThemeColorSchemeKey} from '@sanity/ui/theme'
import {type ReactNode} from 'react'

interface MatrixBuilderProps<Rows extends readonly string[], Cols extends readonly string[]> {
  scheme?: ThemeColorSchemeKey
  columns: Cols
  rows: Rows
  title: string
  subHeader?: ReactNode
  renderItem: ({row, column}: {row: Rows[number]; column: Cols[number]}) => ReactNode
}

function FirstRow({title, columns}: {title: string; columns: readonly string[]}) {
  return (
    <>
      <Flex align="center">
        <Text weight="semibold" size={1}>
          {title}
        </Text>
      </Flex>
      {columns.map((column) => (
        <Flex align="center" key={`${column}-head`}>
          <Text
            weight="semibold"
            size={1}
            style={{textTransform: 'capitalize', textAlign: 'center', width: '100%'}}
          >
            {column}
          </Text>
        </Flex>
      ))}
    </>
  )
}

function Row({row, children}: {row: string; children: ReactNode}) {
  return (
    <>
      <Flex align="center">
        <Text style={{textTransform: 'capitalize'}} size={1}>
          {row}
        </Text>
      </Flex>
      {children}
    </>
  )
}

/**
 * A two-dimensional matrix of a primitive rendered across two axes. `renderItem` is called for
 * every (row, column) pair; the row/column titles label the axes. Optionally scoped to one color
 * `scheme` (wrap two of these in `SchemeCompare` for a light/dark pair).
 */
export function matrixBuilder<Rows extends readonly string[], Cols extends readonly string[]>({
  scheme,
  columns,
  rows,
  title,
  renderItem,
  subHeader,
}: MatrixBuilderProps<Rows, Cols>): ReactNode {
  return (
    <Card scheme={scheme} padding={4} border radius={2}>
      <Grid
        gapX={3}
        gapY={2}
        style={{
          gridTemplateColumns: `repeat(${columns.length + 1}, auto)`,
          gridTemplateRows: `repeat(${rows.length + 1}, auto)`,
        }}
      >
        <FirstRow title={title} gridTemplateColumns={columns} />
        {subHeader}
        {rows.map((row) => (
          <Row row={row} key={row}>
            {columns.map((column) => renderItem({row, column}))}
          </Row>
        ))}
      </Grid>
    </Card>
  )
}

/**
 * Renders `render(scheme)` twice, once per color scheme, in side-by-side local scheme scopes.
 * Each `Card scheme=` opens a nested ThemeProvider scope, so the two frames read light and dark
 * simultaneously regardless of the global toggle — the design-law-2 proof device for any
 * primitive whose whole point is that it tracks the scheme.
 *
 * Pass `frame={false}` when the child already provides its own toned surface (e.g. `matrixBuilder`,
 * whose `scheme=` Card is itself the frame) — then this only labels the two columns and lets the
 * child open the scheme scope, avoiding a card-in-a-card.
 */
export function SchemeCompare({
  render,
  gap = 4,
  frame = true,
}: {
  render: (scheme: ThemeColorSchemeKey) => ReactNode
  gap?: number
  frame?: boolean
}): ReactNode {
  return (
    <Flex gap={gap} wrap="wrap" align="flex-start">
      {(['light', 'dark'] as const).map((scheme) => (
        <Stack key={scheme} gap={3}>
          <Text size={0} muted weight="semibold" style={{textTransform: 'uppercase'}}>
            {scheme}
          </Text>
          {frame ? (
            <Card scheme={scheme} padding={4} border radius={2}>
              {render(scheme)}
            </Card>
          ) : (
            render(scheme)
          )}
        </Stack>
      ))}
    </Flex>
  )
}

/**
 * The measure-labeled caption under a size swatch: the token index and its resolved pixel size,
 * so every size ladder states the real number (design law 8 — sizes are principled, not habits).
 */
export function PxCaption({label, px}: {label: string; px: number | string}): ReactNode {
  return (
    <Stack gap={1} style={{textAlign: 'center'}}>
      <Text size={0} muted weight="semibold">
        {label}
      </Text>
      <Text size={0} muted>
        {px}px
      </Text>
    </Stack>
  )
}
