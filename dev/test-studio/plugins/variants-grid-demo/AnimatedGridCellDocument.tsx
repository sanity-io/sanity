import {Badge, Card, Code, Stack, Text} from '@sanity/ui'
import {AnimatePresence, motion, type Transition} from 'motion/react'
import {type VersionInfoDocumentStub} from 'sanity'
import {styled} from 'styled-components'

const HIGHLIGHT_TRANSITION: Transition = {duration: 0.45, ease: 'easeInOut'}
const BADGE_TRANSITION: Transition = {duration: 0.3, ease: 'easeOut'}

const MotionCellCard = styled(motion.create(Card))`
  outline-style: solid;
  outline-offset: 0;
  transition:
    background-color 0.45s ease,
    border-color 0.45s ease;
`

export function AnimatedGridCellDocument(props: {
  stub: VersionInfoDocumentStub
  isHighlighted: boolean
  onSelect: () => void
}) {
  const {stub, isHighlighted, onSelect} = props

  return (
    <MotionCellCard
      border
      padding={3}
      radius={2}
      tone={isHighlighted ? 'positive' : 'default'}
      animate={{
        outlineWidth: isHighlighted ? 2 : 0,
        outlineColor: isHighlighted ? 'var(--card-focus-ring-color)' : 'transparent',
      }}
      transition={HIGHLIGHT_TRANSITION}
      data-testid={`cell-document-${stub._id}`}
      onClick={onSelect}
      style={{cursor: 'pointer'}}
      title="Set navbar perspective and variant to query this document"
    >
      <Stack space={2}>
        <AnimatePresence initial={false}>
          {isHighlighted && (
            <motion.div
              key="returned-by-query"
              initial={{opacity: 0, y: -6}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -6}}
              transition={BADGE_TRANSITION}
            >
              <Badge tone="positive">returned by query</Badge>
            </motion.div>
          )}
        </AnimatePresence>
        {stub._system?.delete && <Badge tone="caution">unpublishes with release</Badge>}
        <Code size={0} style={{wordBreak: 'break-all', whiteSpace: 'pre-wrap'}}>
          {stub._id}
        </Code>
        {stub._updatedAt && (
          <Text muted size={0}>
            updated {new Date(stub._updatedAt).toLocaleString()}
          </Text>
        )}
      </Stack>
    </MotionCellCard>
  )
}
