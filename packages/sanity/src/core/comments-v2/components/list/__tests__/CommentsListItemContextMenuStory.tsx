import {Card} from '@sanity/ui'
import {type ReactNode} from 'react'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {commentsUsEnglishLocaleBundle} from '../../../i18n'
import {CommentsListItemContextMenu} from '../CommentsListItemContextMenu'

const NOOP = () => undefined

export type CommentsListItemContextMenuStoryMode = 'states' | 'open'

function Labelled({caption, children}: {caption: string; children: ReactNode}) {
  return (
    <VStack gap={2}>
      <Text muted size={1} weight="medium" as="div" trim={true}>
        {caption}
      </Text>
      {children}
    </VStack>
  )
}

/**
 * Chromatic sentinel for the comments-v2 list-item floating action card after
 * the ui5 Flex migration. Reaction / resolve / overflow sit in one Card with
 * shadow — a mix TypeScript will not catch. Copy is locale-fixture only.
 *
 * `MenuButton` is hardcoded to `id="comment-actions-menu"`, so the States
 * grid never mounts more than one overflow trigger. The Open canvas is a
 * single instance.
 */
export function CommentsListItemContextMenuStory(props: {
  mode: CommentsListItemContextMenuStoryMode
}) {
  const {mode} = props

  return (
    <TestWrapper i18nBundles={[commentsUsEnglishLocaleBundle]} schemaTypes={[]}>
      {renderMode(mode)}
    </TestWrapper>
  )
}

function renderMode(mode: CommentsListItemContextMenuStoryMode) {
  switch (mode) {
    case 'states':
      return (
        <Card padding={4} style={{maxWidth: 420}}>
          <VStack gap={5}>
            <Labelled caption="parent open">
              <CommentsListItemContextMenu
                canDelete
                canEdit
                isParent
                mode="default"
                onCopyLink={NOOP}
                onDeleteStart={NOOP}
                onEditStart={NOOP}
                onReactionSelect={NOOP}
                onStatusChange={NOOP}
                status="open"
              />
            </Labelled>
            <Labelled caption="parent resolved">
              <CommentsListItemContextMenu
                canDelete={false}
                canEdit={false}
                isParent
                mode="default"
                onReactionSelect={NOOP}
                onStatusChange={NOOP}
                status="resolved"
              />
            </Labelled>
            <Labelled caption="reply">
              <CommentsListItemContextMenu
                canDelete={false}
                canEdit={false}
                isParent={false}
                mode="default"
                onReactionSelect={NOOP}
                status="open"
              />
            </Labelled>
            <Labelled caption="read-only parent">
              <CommentsListItemContextMenu
                canDelete={false}
                canEdit={false}
                isParent
                mode="default"
                onReactionSelect={NOOP}
                onStatusChange={NOOP}
                readOnly
                status="open"
              />
            </Labelled>
            <Labelled caption="upsell parent">
              <CommentsListItemContextMenu
                canDelete={false}
                canEdit={false}
                isParent
                mode="upsell"
                onReactionSelect={NOOP}
                onStatusChange={NOOP}
                status="open"
              />
            </Labelled>
          </VStack>
        </Card>
      )
    case 'open':
      return (
        <Card padding={4} style={{minHeight: 280, maxWidth: 420}}>
          <CommentsListItemContextMenu
            canDelete
            canEdit
            isParent
            mode="default"
            onCopyLink={NOOP}
            onDeleteStart={NOOP}
            onEditStart={NOOP}
            onReactionSelect={NOOP}
            onStatusChange={NOOP}
            status="open"
          />
        </Card>
      )
    default: {
      const exhaustive: never = mode
      return exhaustive
    }
  }
}
