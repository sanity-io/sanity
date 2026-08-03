import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Flex, LayerProvider, Text, ToastProvider} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {Translate, useTranslation} from 'sanity'

import {structureLocaleNamespace} from '../../../../packages/sanity/src/structure/i18n'
// The shared banner chrome and the one genuinely prop-only beta banner, from their real
// paths (org contract §8). Both live in the structure package's document panel.
import {Banner} from '../../../../packages/sanity/src/structure/panes/document/documentPanel/banners/Banner'
import {VariantDefinitionNotFoundBanner} from '../../../../packages/sanity/src/structure/panes/document/documentPanel/banners/VariantDefinitionNotFoundBanner'
import {Button} from '../../../../packages/sanity/src/ui-components/button/Button'

/**
 * The document-panel banner strip stacks these thin cards above the form. Most beta banners
 * are a hook-reading shell (they call `useDocumentPane` / `usePerspective` /
 * `useCanvasCompanionDoc` / `useScheduledDraftDocument` and then render the shared `Banner`
 * with a tone, icon, translated content and an optional action). Rather than mock the whole
 * document-pane context for a props-only bucket, these stories drive the **real** `Banner`
 * primitive with the exact tone/content/action each wrapper passes, the real translated
 * copy included, and mount the one banner that is genuinely prop-only
 * (`VariantDefinitionNotFoundBanner`) directly. The wrapper's job (deciding *whether* to show
 * and *which* string) is exactly what the fixtures stand in for.
 */

const meta: Meta = {
  title: 'Document Banners/In a live pane',
  // Placed under CMS Patterns (not Laws & Behaviors): these banners are content-lifecycle
  // surfaces — they announce variant/scheduling/Canvas state of the document being edited,
  // sitting on the draft→publish→variant lifecycle the CMS chapter owns.
  decorators: [
    (Story) => (
      <ToastProvider>
        <LayerProvider>
          <div style={{maxWidth: 720}}>
            <Story />
          </div>
        </LayerProvider>
      </ToastProvider>
    ),
  ],
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'The most expensive editing mistakes come from acting on a document whose state a ' +
            'person misread. These banners are Studio’s answer: a single, calm strip that says, ' +
            'before you edit, here is the unusual thing about this document.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/structure/panes/document/documentPanel/banners/*`, Studio-only (no design-system equivalent); all share the `Banner` chrome primitive |',
          '| Flag | varies per banner: `beta.variants.enabled` (variant banners), `scheduledDrafts.enabled` (scheduled-draft override), `apps.canvas.enabled` (Canvas linked). Each story tags its own gating flag |',
          '| Tier | CHROME. A document-scoped status strip. `Banner` is a pure layout atom (icon + content + right-aligned action, toned by `CardTone`); the beta banners are hook-reading shells that pick a tone/string and render it |',
          '| Audit | ⚪ not-audited. These beta banners post-date the pattern pass. The law they serve is `system-status-visibility`: the editor must be told when the document is in an unusual state before they act |',
          '| Patterns | `document-banners` |',
          '',
          'Every beta feature that can put a document into a surprising state (viewing a ' +
            'variant, about to override a schedule, linked to Canvas) adds one, and they all ' +
            'speak through the same `Banner` primitive so they read as one family.',
          '',
          'Every story renders the real `Banner` with real i18n. ' +
            '`VariantDefinitionNotFoundBanner` is mounted as its actual component (prop-only); ' +
            'the other three compose `Banner` with the same tone/icon/content/action their ' +
            'wrappers pass, because those wrappers only exist to read document-pane state a ' +
            'props-only story does not have.',
          '',
          '> **Why it matters:** `Banner` is a pure layout atom, icon, content, right-aligned ' +
            'action, toned by `CardTone`. It carries no logic of its own. All the intelligence ' +
            'lives in the wrapper that reads document-pane state and picks the tone and string. ' +
            'These stories drive the primitive with fixtures rather than mounting the wrappers.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:cms',
    'pattern:document-banners',
    'audit:not-audited',
    'source:studio-only',
    'tier:chrome',
  ],
}

export default meta
type Story = StoryObj

// Hoisted so it isn't redefined on every render (the real banner inlines it, but that trips
// react/no-unstable-nested-components in a story render function).
function VariantBadge({children}: {children?: React.ReactNode}) {
  return <strong>{children}</strong>
}

/**
 * Shown when a document has no version in the currently-selected variant. A `suggest`-toned
 * prompt with a "Create variant" action. Composed from the real `Banner` with the same
 * `Translate` copy the wrapper renders (the wrapper adds the create-and-toast logic).
 *
 * Flag: `beta.variants.enabled`.
 */
export const NotInVariant: Story = {
  name: 'Document not in variant',
  tags: ['pattern:variants', 'flag:beta.variants.enabled'],
  render: function NotInVariantStory() {
    const {t} = useTranslation(structureLocaleNamespace)
    return (
      <Banner
        tone="suggest"
        content={
          <Text size={1}>
            <Translate
              i18nKey="banners.variant.not-in-variant"
              t={t}
              values={{title: 'Nordic (da-DK)'}}
              components={{VariantBadge}}
            />
          </Text>
        }
        action={{
          text: t('banners.variant.action.add-to-variant'),
          tone: 'suggest',
          mode: 'default',
          onClick: () => {},
        }}
      />
    )
  },
}

/**
 * The real, prop-only banner: shown when the variant requested via the router matches no
 * `system.variant` definition. Mounted as its actual component, an explicit error surface
 * so an invalid selection never silently behaves like "no variant".
 *
 * Flag: `beta.variants.enabled`.
 */
export const VariantDefinitionNotFound: Story = {
  name: 'Variant definition not found',
  tags: ['pattern:variants', 'flag:beta.variants.enabled'],
  render: () => <VariantDefinitionNotFoundBanner requestedVariantName="promo-2026" />,
}

/**
 * Warns that publishing now will be overwritten when a scheduled draft runs. A `caution`
 * banner with a warning glyph and no action, informational only. The real wrapper gates on
 * matching published ids and differing base revisions; here the fixture is that "true" case.
 *
 * Flag: `scheduledDrafts.enabled`.
 */
export const ScheduledDraftOverride: Story = {
  name: 'Scheduled draft override',
  tags: ['pattern:scheduled-drafts', 'flag:scheduledDrafts.enabled'],
  render: function ScheduledDraftOverrideStory() {
    const {t} = useTranslation(structureLocaleNamespace)
    return (
      <Banner
        tone="caution"
        icon={WarningOutlineIcon}
        content={
          <Text size={1}>
            <Translate t={t} i18nKey="banners.scheduled-draft-override-banner.text" />
          </Text>
        }
      />
    )
  },
}

/**
 * Shown when the document is linked to Canvas: a `neutral` banner stating the link, an info
 * button (whose popover, a Studio-hook surface, is omitted here) and an "Edit in Canvas"
 * action. Composed from `Banner`; the wrapper resolves the companion doc and lock state.
 *
 * Flag: `apps.canvas.enabled`.
 */
export const CanvasLinked: Story = {
  name: 'Canvas linked',
  tags: ['pattern:canvas-linking', 'flag:apps.canvas.enabled'],
  render: function CanvasLinkedStory() {
    const {t} = useTranslation(structureLocaleNamespace)
    return (
      <Banner
        tone="neutral"
        paddingY={0}
        content={
          <Flex align="center" gap={2}>
            <Text size={1} weight="medium">
              {t('canvas.banner.linked-text.draft')}
            </Text>
            <Button
              tooltipProps={null}
              mode="bleed"
              tone="default"
              icon={InfoOutlineIcon}
              onClick={() => {}}
            />
          </Flex>
        }
        action={{
          mode: 'ghost',
          text: t('canvas.banner.edit-in-canvas-action'),
          onClick: () => {},
        }}
      />
    )
  },
}
