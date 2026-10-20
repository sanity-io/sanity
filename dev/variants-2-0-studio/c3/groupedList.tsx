import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {Box, Flex, Text} from '@sanity/ui'
import {type ReactNode, useCallback, useMemo, useState} from 'react'
import {getPublishedId} from 'sanity'
import {
  DOCUMENT_LIST_SECTION_TYPE,
  type DocumentListArrange,
  DocumentListArrangeProvider,
} from 'sanity/structure'

import {type SystemVariant} from '../c1/model'
import {useCorpus} from '../c5/useCorpus'
import {createPerspectiveMatch} from '../data/matchCore'
import {useOptionState, useOption} from '../options/store'

/**
 * C3 option D: with a perspective active, the document list is grouped by match: "Has variant" and "No variant for this perspective" (the
 * second collapses), or sorted (Look > List when a perspective is active): the documents that have a variant first. The section says what the
 * per-row diamond says in the other options, so rows carry no diamond here. Through the PROPOSED `DocumentListArrangeProvider`.
 */

const HAS = '__section-has-variant'
const NONE = '__section-no-variant'

function SectionRow(props: {
  title: string
  count: number
  collapsed?: boolean
  onToggle?: () => void
  testId: string
}) {
  const {title, count, collapsed, onToggle, testId} = props
  const inner: ReactNode = (
    <Flex align="center" gap={2}>
      {onToggle ? (
        <Text size={1}>{collapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}</Text>
      ) : null}
      <Text muted size={1} weight="medium">
        {title}
      </Text>
      <Text muted size={0}>
        {count}
      </Text>
    </Flex>
  )
  return (
    <Box
      data-testid={testId}
      paddingX={2}
      paddingY={0}
      style={{alignItems: 'flex-end', display: 'flex', height: 50, paddingBottom: 8}}
    >
      {onToggle ? (
        <button
          aria-expanded={!collapsed}
          onClick={onToggle}
          style={{
            background: 'none',
            border: 0,
            color: 'inherit',
            cursor: 'pointer',
            font: 'inherit',
            padding: 0,
          }}
          type="button"
        >
          {inner}
        </button>
      ) : (
        inner
      )}
    </Box>
  )
}

/**
 * The provider: reads the perspective, the corpus and the options in a component of its own and gives the list a plain function that
 * arranges its rows. Mounted around the studio's layout.
 */
export function ListArrangeProvider(props: {
  chosen: Record<string, string>
  definitions: readonly SystemVariant[]
  children: ReactNode
}) {
  const option = useOption('c3')
  const {listWhenPerspective} = useOptionState()
  const {chosen, definitions} = props
  const perspective = useMemo(
    () => createPerspectiveMatch(chosen, definitions),
    [chosen, definitions],
  )
  const corpus = useCorpus()
  const [noneCollapsed, setNoneCollapsed] = useState(false)
  const toggle = useCallback(() => setNoneCollapsed((v) => !v), [])

  const arrange = useMemo<DocumentListArrange | null>(() => {
    if (option !== 'd' || !perspective.active || !corpus) return null
    const variantsOf = new Map(corpus.docs.map((d) => [d.id, d.variantIds]))
    return (items) => {
      const has = items.filter(
        (item) => perspective.best(variantsOf.get(getPublishedId(item._id)) ?? []) !== null,
      )
      const none = items.filter((item) => !has.includes(item))
      const section = (id: string) => ({
        _id: id,
        _type: DOCUMENT_LIST_SECTION_TYPE,
        _createdAt: '',
        _updatedAt: '',
        _rev: '',
        hasPublished: false,
        hasDraft: false,
      })
      const sorted = listWhenPerspective === 'sorted'
      return {
        items: sorted
          ? [...has, ...none]
          : [section(HAS), ...has, section(NONE), ...(noneCollapsed ? [] : none)],
        renderSection: (item) =>
          item._id === HAS ? (
            <SectionRow count={has.length} testId="list-section-has" title="Has variant" />
          ) : (
            <SectionRow
              collapsed={noneCollapsed}
              count={none.length}
              onToggle={toggle}
              testId="list-section-none"
              title="No variant for this perspective"
            />
          ),
      }
    }
  }, [option, perspective, corpus, listWhenPerspective, noneCollapsed, toggle])

  return <DocumentListArrangeProvider value={arrange}>{props.children}</DocumentListArrangeProvider>
}
