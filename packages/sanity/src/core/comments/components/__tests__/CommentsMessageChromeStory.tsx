import {type CurrentUser, type PortableTextBlock, type User} from '@sanity/types'
import {Card} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {type ReactNode, useState} from 'react'
import {Flex, Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {Button} from '../../../../ui-components/button/Button'
import {type UserWithPermission} from '../../../hooks/useUserListWithPermissions'
import {COMMENT_REACTION_OPTIONS} from '../../constants'
import {commentsUsEnglishLocaleBundle} from '../../i18n'
import {FloatingButtonPopover} from '../../plugin/input/components/FloatingButtonPopover'
import {CommentsInspectorHeader} from '../../plugin/inspector/CommentsInspectorHeader'
import {type CommentReactionItem} from '../../types'
import {CommentsAvatar} from '../avatars/CommentsAvatar'
import {SpacerAvatar} from '../avatars/SpacerAvatar'
import {MentionsMenuItem} from '../mentions/MentionsMenuItem'
import {CommentsOnboardingPopover} from '../onboarding/CommentsOnboardingPopover'
import {MentionInlineBlock} from '../pte/blocks/MentionInlineBlock'
import {NormalBlock} from '../pte/blocks/NormalBlock'
import {CommentInlineHighlightSpan} from '../pte/CommentInlineHighlightSpan'
import {CommentMessageSerializer} from '../pte/CommentMessageSerializer'
import {CommentReactionsBar} from '../reactions/CommentReactionsBar'
import {CommentReactionsMenu} from '../reactions/CommentReactionsMenu'
import {CommentReactionsMenuButton} from '../reactions/CommentReactionsMenuButton'
import {CommentReactionsUsersTooltip} from '../reactions/CommentReactionsUsersTooltip'

/** The user the TestWrapper's mock workspace signs in as, so `useUser('doug')` resolves offline. */
const CURRENT_USER_ID = 'doug'

const CURRENT_USER: CurrentUser = {
  id: CURRENT_USER_ID,
  name: 'Doug',
  email: 'doug@sanity.io',
  // oxlint-disable-next-line no-deprecated -- CurrentUser still requires the legacy role field
  role: 'administrator',
  roles: [{name: 'administrator', title: 'Administrator'}],
}

const ADA: User = {id: 'user-ada', displayName: 'Ada Lovelace'}

const MENTION_CANDIDATE: UserWithPermission = {
  id: CURRENT_USER_ID,
  displayName: 'Doug',
  granted: true,
}

const MENTION_CANDIDATE_NO_ACCESS: UserWithPermission = {...MENTION_CANDIDATE, granted: false}

const MESSAGE: PortableTextBlock[] = [
  {
    _type: 'block',
    _key: 'b1',
    style: 'normal',
    markDefs: [],
    children: [
      {_type: 'span', _key: 's1', text: 'Could you take another look, ', marks: []},
      {_type: 'mention', _key: 'm1', userId: CURRENT_USER_ID},
      {_type: 'span', _key: 's2', text: '? The intro still reads a bit long.', marks: []},
    ],
  },
  {
    _type: 'block',
    _key: 'b2',
    style: 'normal',
    markDefs: [],
    children: [
      {_type: 'span', _key: 's3', text: 'Second paragraph of the same comment.', marks: []},
    ],
  },
]

const REACTIONS: CommentReactionItem[] = [
  {_key: 'r1', shortName: ':+1:', userId: CURRENT_USER_ID, addedAt: '2024-01-01T00:00:00.000Z'},
  {_key: 'r2', shortName: ':+1:', userId: 'user-ada', addedAt: '2024-01-01T00:01:00.000Z'},
  {_key: 'r3', shortName: ':eyes:', userId: 'user-ada', addedAt: '2024-01-01T00:02:00.000Z'},
]

function Section(props: {title: string; children: ReactNode}) {
  return (
    <VStack gap={2}>
      <Text muted size={1} weight="medium" as="div" trim={true}>
        {props.title}
      </Text>
      {props.children}
    </VStack>
  )
}

function FloatingButtonSection() {
  const [reference, setReference] = useState<HTMLDivElement | null>(null)

  return (
    <Card border padding={4} radius={2} style={{minHeight: 96}}>
      <div ref={setReference} style={{width: 120, height: 2}} />
      {reference ? (
        <FloatingButtonPopover
          disabled={false}
          onClick={noop}
          onClickOutside={noop}
          referenceElement={reference}
        />
      ) : null}
    </Card>
  )
}

/**
 * The building blocks a rendered comment is made of: avatars and their spacer, the message
 * serializer with its normal and mention blocks, the inline highlight span states, a mention
 * menu item, the reactions bar, menu and menu button, the onboarding popover, the floating
 * "add comment" popover and the inspector header. Users resolve from the mock workspace's
 * signed-in user, so nothing is fetched.
 */
export function CommentsMessageChromeStory() {
  return (
    <TestWrapper i18nBundles={[commentsUsEnglishLocaleBundle]} schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 480}}>
        <VStack gap={5}>
          <Section title="avatars: initials, image-less, no user, sizes, inactive, spacer">
            <Flex alignItems="center" gap={2}>
              <CommentsAvatar user={ADA} />
              <CommentsAvatar user={{id: 'user-grace', displayName: 'Grace'}} />
              <CommentsAvatar user={null} />
              <CommentsAvatar size={0} user={ADA} />
              <CommentsAvatar size={2} user={ADA} />
              <CommentsAvatar status="inactive" user={ADA} />
              <SpacerAvatar />
              <SpacerAvatar $size={2} />
              <Text size={1}>after spacers</Text>
            </Flex>
          </Section>

          <Section title="message serializer with a mention, normal block, mention states">
            <CommentMessageSerializer blocks={MESSAGE} />
            <NormalBlock>A stand-alone normal block that wraps long words gracefully.</NormalBlock>
            <Text size={1}>
              <MentionInlineBlock selected={false} userId={CURRENT_USER_ID} />{' '}
              <MentionInlineBlock selected userId={CURRENT_USER_ID} />
            </Text>
          </Section>

          <Section title="inline highlight span: added, nested, hovered, authoring, none">
            <Text size={2}>
              <CommentInlineHighlightSpan isAdded>added</CommentInlineHighlightSpan>{' '}
              <CommentInlineHighlightSpan isAdded isNested>
                nested
              </CommentInlineHighlightSpan>{' '}
              <CommentInlineHighlightSpan isAdded isHovered>
                hovered
              </CommentInlineHighlightSpan>{' '}
              <CommentInlineHighlightSpan isAuthoring>authoring</CommentInlineHighlightSpan>{' '}
              <CommentInlineHighlightSpan>plain</CommentInlineHighlightSpan>
            </Text>
          </Section>

          <Section title="mention menu item: granted, no access">
            <MentionsMenuItem onSelect={noop} user={MENTION_CANDIDATE} />
            <MentionsMenuItem onSelect={noop} user={MENTION_CANDIDATE_NO_ACCESS} />
          </Section>

          <Section title="reactions: bar, read-only bar, users tooltip trigger, menu, menu button">
            <CommentReactionsBar
              currentUser={CURRENT_USER}
              mode="default"
              onSelect={noop}
              reactions={REACTIONS}
            />
            <CommentReactionsBar
              currentUser={CURRENT_USER}
              mode="default"
              onSelect={noop}
              reactions={REACTIONS}
              readOnly
            />
            <Flex>
              <CommentReactionsUsersTooltip
                currentUser={CURRENT_USER}
                reactionName=":+1:"
                userIds={[CURRENT_USER_ID, 'user-ada']}
              >
                <Button mode="ghost" text="Hover for reaction users" />
              </CommentReactionsUsersTooltip>
            </Flex>
            <Card border padding={1} radius={2}>
              <CommentReactionsMenu onSelect={noop} options={COMMENT_REACTION_OPTIONS} />
            </Card>
            <Flex>
              <CommentReactionsMenuButton
                mode="default"
                onSelect={noop}
                options={COMMENT_REACTION_OPTIONS}
                renderMenuButton={({tooltipContent}) => (
                  <Button mode="bleed" text={tooltipContent} />
                )}
              />
            </Flex>
          </Section>

          <Section title="onboarding popover (open)">
            <Flex justifyContent="center" paddingTop={6}>
              <CommentsOnboardingPopover onDismiss={noop} open placement="top" portal={false}>
                <Button mode="ghost" text="Comments" />
              </CommentsOnboardingPopover>
            </Flex>
          </Section>

          <Section title="floating add-comment popover">
            <FloatingButtonSection />
          </Section>

          <Section title="inspector header: open, resolved, upsell">
            <Card border radius={2}>
              <CommentsInspectorHeader
                mode="default"
                onClose={noop}
                onViewChange={noop}
                view="open"
              />
            </Card>
            <Card border radius={2}>
              <CommentsInspectorHeader
                mode="default"
                onClose={noop}
                onViewChange={noop}
                view="resolved"
              />
            </Card>
            <Card border radius={2}>
              <CommentsInspectorHeader
                mode="upsell"
                onClose={noop}
                onViewChange={noop}
                view="open"
              />
            </Card>
          </Section>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
