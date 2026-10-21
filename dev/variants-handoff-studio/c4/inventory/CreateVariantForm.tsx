import {type ReleaseDocument} from '@sanity/client'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {
  // oxlint-disable-next-line no-restricted-imports -- the field's menu button holds a full option row, as in Studio's ReleaseForm
  Button as UIButton,
  Box,
  Card,
  Flex,
  Stack,
  Text,
} from '@sanity/ui'
import {
  Menu,
  MenuDivider,
  // oxlint-disable-next-line no-restricted-imports -- a menu item holds a full option row, as in Studio's ReleaseForm
  MenuItem,
} from '@sanity/ui/menu'
import {useToast} from '@sanity/ui/toast'
import {type FormEvent, type ReactNode, useId, useState} from 'react'

// Ported from Andrej's version inventory side panel in the Storybook Variants 2.0 branch (sanity-labs/sanity-studio-storybook,
// explorations/inventory-sidepanel (PR #47), commit 10f3f729a9, lib/explorations/variants/create-variant-form/CreateVariantForm.tsx).
// Changes: imports point at this monorepo and ./fixtures (a LIVE replacement of his fixtures); LIVE: marks other changes.
import {ReleaseAvatar} from '../../../../packages/sanity/src/core/releases/components/ReleaseAvatar'
import {
  isNotArchivedRelease,
  isReleaseScheduledOrScheduling,
} from '../../../../packages/sanity/src/core/releases/util/util'
import {Button} from '../../../../packages/sanity/src/ui-components/button/Button'
import {Dialog} from '../../../../packages/sanity/src/ui-components/dialog/Dialog'
import {MenuButton} from '../../../../packages/sanity/src/ui-components/menuButton/MenuButton'
import {
  type DimensionName,
  type InventoryEntry,
  type InventoryGroupId,
  type InventoryWorld,
  type Visitor,
  worldDimensions,
} from './fixtures'
import {findExactVariant, shortVariantId, useInventoryConcepts} from './model'

/**
 * The create variant form, in Studio's dialog for a form: the shell, field layout and footer of the
 * variant definition dialog (`variants/components/dialog/VariantDialog.tsx`), and for each choice
 * of one value the menu button of the create release form (`releases/components/dialog/
 * ReleaseForm.tsx`). The fields, top to bottom: one per dimension, then Destination. Each field
 * starts at the Perspective bar's value.
 *
 * The new version copies the nearest version: the variant's draft, then its published version, then
 * the base. Creating writes nothing: it shows Studio's pending toast, then marks the version as
 * created, so the button reads Open existing version.
 */
export function CreateVariantForm(props: {onClose: () => void}): ReactNode {
  const {visitor, release} = useInventoryConcepts()
  // A new bar perspective starts the form again from the bar's values.
  return (
    <CreateVariantFormBody
      initialAddress={visitor}
      key={`${release}:${JSON.stringify(visitor)}`}
      onClose={props.onClose}
      release={release}
    />
  )
}

/** A version's place as the form names it: Published, Draft, or the release's title. */
function bundleLabel(world: InventoryWorld, group: string): string {
  if (group === 'published') return 'Published'
  if (group === 'drafts') return 'Draft'
  return world.releases.find((doc) => doc.name === group)?.metadata.title ?? group
}

/**
 * The releases a variant can go into, with Studio's filter for the create popover: not published,
 * not archived, not scheduled. Scheduled drafts hold one document and are left out.
 */
function openReleases(world: InventoryWorld): ReleaseDocument[] {
  return world.releases.filter(
    (doc) =>
      doc.state !== 'published' &&
      isNotArchivedRelease(doc) &&
      !isReleaseScheduledOrScheduling(doc) &&
      doc.metadata.cardinality !== 'one',
  )
}

function CreateVariantFormBody(props: {
  initialAddress: Visitor
  release: string
  onClose: () => void
}): ReactNode {
  const {initialAddress, release, onClose} = props
  const {world} = useInventoryConcepts()
  const toast = useToast()
  // Studio cannot create a variant into Published: the form falls back to Drafts and says so.
  const publishedInBar = release === 'published'

  const [address, setAddress] = useState<Visitor>(initialAddress)
  const [destination, setDestination] = useState(publishedInBar ? 'drafts' : release)
  const [created, setCreated] = useState<InventoryEntry[]>([])

  const entries = [...world.entries, ...created]
  const hasValue = Object.values(address).some((value) => value !== undefined)
  const definition = hasValue ? findExactVariant(world, address) : undefined
  const variantId = definition ? shortVariantId(definition) : undefined
  const versionOf = (group: string) =>
    entries.find((entry) => entry.group === group && entry.variantId === variantId)
  const existing = definition ? versionOf(destination) : undefined

  // Studio's order for the version a new one copies: the variant's draft, then its published
  // version, then the base.
  const source =
    (definition ? (versionOf('drafts') ?? versionOf('published')) : undefined) ??
    entries.find((entry) => entry.group === 'drafts' && entry.variantId === undefined) ??
    entries.find((entry) => entry.group === 'published' && entry.variantId === undefined)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!definition || existing) return
    toast.push({
      id: 'create-variant-form',
      status: 'info',
      title: 'Adding document to variant…',
      description:
        'Please hold tight while the document is added to the variant. It should not take longer than a few seconds.',
    })
    setCreated((current) => [
      ...current,
      {
        key: `${destination}.${variantId}`,
        group: destination as InventoryGroupId,
        variantId,
        changedFields: source?.changedFields ?? [],
        updated: 'Just now',
      },
    ])
  }

  return (
    <Dialog
      __unstable_autoFocus={false}
      header="Create variant"
      id="create-variant-dialog"
      onClickOutside={onClose}
      onClose={onClose}
      padding={false}
      width={1}
    >
      <Card borderTop padding={4}>
        <form data-testid="create-variant-form" onSubmit={handleSubmit}>
          <Box paddingBottom={4}>
            <Stack gap={5}>
              {worldDimensions(world).map((dimension) => {
                const name = dimension.name as DimensionName
                const selected = dimension.values.find((v) => v.value === address[name])
                return (
                  <ChoiceField
                    key={dimension.name}
                    label={dimension.title}
                    onSelect={(value) => setAddress({...address, [name]: value})}
                    options={[
                      {value: undefined, title: 'All'},
                      ...dimension.values.map((v) => ({value: v.value, title: v.title})),
                    ]}
                    testId={`address-${dimension.name}`}
                    value={selected?.title ?? 'All'}
                  />
                )
              })}

              <ChoiceField
                description={
                  publishedInBar
                    ? 'A variant cannot be created into Published. It is created as a draft.'
                    : undefined
                }
                label="Destination"
                onSelect={(value) => value && setDestination(value)}
                options={[
                  {value: 'drafts', title: 'As a draft', avatar: 'drafts' as const},
                  ...openReleases(world).map((doc) => ({
                    value: doc.name,
                    title: doc.metadata.title ?? doc.name,
                    avatar: doc,
                  })),
                ]}
                testId="destination"
                value={destination === 'drafts' ? 'As a draft' : bundleLabel(world, destination)}
                valueAvatar={
                  destination === 'drafts'
                    ? 'drafts'
                    : world.releases.find((doc) => doc.name === destination)
                }
              />
            </Stack>
          </Box>
          <Flex gap={2} justify="flex-end" paddingTop={5}>
            <Button mode="ghost" onClick={onClose} text="Cancel" type="button" />
            {existing ? (
              <Button size="large" text="Open existing version" type="button" />
            ) : (
              <Button
                data-testid="create-variant-submit"
                disabled={!definition}
                size="large"
                text="Create variant"
                type="submit"
              />
            )}
          </Flex>
        </form>
      </Card>
    </Dialog>
  )
}

interface ChoiceOption {
  value: string | undefined
  title: string
  avatar?: ReleaseDocument | 'drafts'
}

/**
 * One field that chooses one value from a list: its label, then a full-width menu button that
 * shows the value, as the release type field of Studio's create release form draws it.
 */
function ChoiceField(props: {
  label: string
  description?: string
  value: string
  valueAvatar?: ReleaseDocument | 'drafts'
  options: ChoiceOption[]
  onSelect: (value: string | undefined) => void
  testId: string
}): ReactNode {
  const {label, description, value, valueAvatar, options, onSelect, testId} = props
  const id = useId()
  const [menuButton, setMenuButton] = useState<HTMLElement | null>(null)
  const [first, ...rest] = options
  const allFirst = first?.value === undefined
  return (
    <Stack gap={3}>
      <Stack gap={2}>
        <Text as="label" htmlFor={id} size={1} weight="medium">
          {label}
        </Text>
        {description && (
          <Text muted size={1}>
            {description}
          </Text>
        )}
      </Stack>
      <MenuButton
        button={
          <UIButton data-testid={testId} mode="ghost">
            <Flex align="center" justify="space-between">
              <OptionRow avatar={valueAvatar} title={value} />
              <Text size={1}>
                <ChevronDownIcon />
              </Text>
            </Flex>
          </UIButton>
        }
        id={id}
        menu={
          <Menu>
            {allFirst && first && (
              <>
                <MenuItem onClick={() => onSelect(undefined)}>
                  <OptionRow title={first.title} />
                </MenuItem>
                <MenuDivider />
              </>
            )}
            {(allFirst ? rest : options).map((option) => (
              <MenuItem key={option.value} onClick={() => onSelect(option.value)}>
                <OptionRow avatar={option.avatar} title={option.title} />
              </MenuItem>
            ))}
          </Menu>
        }
        popover={{
          placement: 'bottom',
          matchReferenceWidth: true,
          floatingBoundary: menuButton,
          referenceBoundary: menuButton,
        }}
        ref={setMenuButton}
      />
    </Stack>
  )
}

/**
 * An option as the field and its menu show it: the release's avatar, if any, then the title. The
 * avatar has no padding, so a field is as tall as Studio's other inputs with or without one.
 */
function OptionRow({title, avatar}: {title: string; avatar?: ReleaseDocument | 'drafts'}) {
  return (
    <Flex align="center" gap={3}>
      {avatar && <ReleaseAvatar padding={0} release={avatar} />}
      <Text>{title}</Text>
    </Flex>
  )
}
