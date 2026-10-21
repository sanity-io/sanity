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

import {RhombusIcon} from '../../../packages/sanity/src/core/components/temporary-icons/Rhombus'
import {type SystemVariant} from '../c1/model'
import {useCorpus} from '../c5/useCorpus'
import {createPerspectiveMatch} from '../data/matchCore'
import {CmdClickOpensBeside, ListMarkStyles, ReviewHeader, ReviewSetHeader} from '../list/ListParts'
import {exactVariantId} from '../list/listStore'
import {useOptionState, useOption} from '../options/store'

/**
 * C3 option D: with a perspective active, the document list is grouped by match: "Has variant" and "No variant for this perspective" (the
 * second collapses), or sorted (Look > List when a perspective is active): the documents that have a variant first. The section says what the
 * per-row diamond says in the other options, so rows carry no diamond here. Through the PROPOSED `DocumentListArrangeProvider`.
 */

const HAS = '__section-has-variant'
const NONE = '__section-no-variant'
const HEADER = '__section-review-header'
const SET_HEADER = '__section-review-set'

function SectionRow(props: {
  title: string
  /** listMark B: one purple variant diamond on the stack. */
  diamond?: boolean
  count: number
  collapsed?: boolean
  onToggle?: () => void
  testId: string
}) {
  const {title, count, collapsed, onToggle, testId, diamond} = props
  const inner: ReactNode = (
    <Flex align="center" gap={2}>
      {onToggle ? (
        <Text size={1}>{collapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}</Text>
      ) : null}
      {diamond ? (
        <Text
          data-testid="list-diamond"
          size={1}
          style={{color: 'var(--card-badge-suggest-dot-color)'}}
        >
          <RhombusIcon />
        </Text>
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

/** reviewSet: the list as it is, under a review-set line (M3, M4). */
const arrangeWithSetHeader: DocumentListArrange = (items) => {
  const type = items.find((item) => item._type !== DOCUMENT_LIST_SECTION_TYPE)?._type ?? ''
  return {
    items: [
      {
        _id: SET_HEADER,
        _type: DOCUMENT_LIST_SECTION_TYPE,
        _createdAt: '',
        _updatedAt: '',
        _rev: '',
        hasPublished: false,
        hasDraft: false,
      },
      ...items,
    ],
    renderSection: () => <ReviewSetHeader type={type} />,
  }
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
  const listMark = useOption('listMark')
  const reviewPass = useOption('reviewPass')
  const reviewSet = useOption('reviewSet')
  const {chosen, definitions} = props
  const perspective = useMemo(
    () => createPerspectiveMatch(chosen, definitions),
    [chosen, definitions],
  )
  const corpus = useCorpus()
  const [noneCollapsed, setNoneCollapsed] = useState(false)
  const toggle = useCallback(() => setNoneCollapsed((v) => !v), [])

  const arrange = useMemo<DocumentListArrange | null>(() => {
    // reviewSet (M3, M4): a header line over the plain list, with no variant perspective.
    if (reviewSet !== 'a' && !perspective.active) return arrangeWithSetHeader
    if ((option !== 'd' && reviewPass === 'a') || !perspective.active || !corpus) return null
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
      const variantId = exactVariantId(chosen, definitions)
      const variantTitle =
        definitions.find((d) => variantId && d._id === `_.variants.${variantId}`)?.metadata
          ?.title ??
        variantId ??
        ''
      const type = items.find((item) => item._type !== DOCUMENT_LIST_SECTION_TYPE)?._type ?? ''
      const withHeader = reviewPass !== 'a' && variantId
      const header = withHeader ? [section(HEADER)] : []
      const sorted = listWhenPerspective === 'sorted'
      const grouped =
        option !== 'd'
          ? items
          : sorted
            ? [...has, ...none]
            : [section(HAS), ...has, section(NONE), ...(noneCollapsed ? [] : none)]
      return {
        items: [...header, ...grouped],
        renderSection: (item) =>
          item._id === HEADER ? (
            <ReviewHeader
              orderedIds={has.map((h) => getPublishedId(h._id))}
              title={variantTitle}
              type={type}
              variantId={variantId ?? ''}
            />
          ) : item._id === HAS ? (
            <SectionRow
              count={has.length}
              diamond={listMark === 'b'}
              testId="list-section-has"
              title="Has variant"
            />
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
  }, [
    reviewSet,
    option,
    perspective,
    corpus,
    listWhenPerspective,
    noneCollapsed,
    toggle,
    reviewPass,
    listMark,
    chosen,
    definitions,
  ])

  return (
    <DocumentListArrangeProvider value={arrange}>
      <ListMarkStyles />
      <CmdClickOpensBeside />
      {props.children}
    </DocumentListArrangeProvider>
  )
}
