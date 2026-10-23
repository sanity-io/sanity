import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {PinIcon} from '@sanity/icons/Pin'
import {PinRemovedIcon} from '@sanity/icons/PinRemoved'
import {SearchIcon} from '@sanity/icons/Search'
import {Button, Stack, TextInput} from '@sanity/ui'
import {Menu, MenuButton, MenuDivider, MenuItem} from '@sanity/ui/menu'
import {Tooltip} from '@sanity/ui/tooltip'
import {type ChangeEvent, Fragment, useMemo, useState} from 'react'
import {useTranslation, useWorkspace} from 'sanity'
import {
  useWorkspaces,
  type WorkspaceSummary,
} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'
import {Box, Flex, Text} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {type VisionDatasetMode} from '../../store/types'
import {useVisionSelector} from '../../store/VisionActorContext'
import {selectProjectId} from '../../store/visionMachine'

export interface DatasetMenuEntry {
  dataset: string
  /** Titles of the workspaces of this project that use the dataset */
  workspaces: string[]
}

export interface DatasetMenuGroups {
  current: DatasetMenuEntry | null
  used: DatasetMenuEntry[]
  unused: DatasetMenuEntry[]
}

const byDataset = (a: DatasetMenuEntry, b: DatasetMenuEntry) => a.dataset.localeCompare(b.dataset)

/**
 * Sorts the project's datasets into the current workspace's, those other workspaces of the
 * project use, and the rest; the query matches dataset names and workspace titles
 */
export function groupDatasets(options: {
  datasets: readonly string[]
  workspaceDataset: string
  workspaces: readonly Pick<WorkspaceSummary, 'name' | 'title' | 'dataset' | 'projectId'>[]
  projectId: string
  query: string
}): DatasetMenuGroups {
  const {datasets, workspaceDataset, workspaces, projectId} = options
  const query = options.query.trim().toLowerCase()
  const usedBy = new Map<string, string[]>()
  for (const workspace of workspaces) {
    if (workspace.projectId !== projectId) continue
    const titles = usedBy.get(workspace.dataset) ?? []
    titles.push(workspace.title || workspace.name)
    usedBy.set(workspace.dataset, titles)
  }

  const entry = (dataset: string): DatasetMenuEntry => ({
    dataset,
    workspaces: usedBy.get(dataset) ?? [],
  })
  const matches = ({dataset, workspaces: titles}: DatasetMenuEntry) =>
    !query ||
    dataset.toLowerCase().includes(query) ||
    titles.some((title) => title.toLowerCase().includes(query))

  const known = new Set(datasets)
  const current = entry(workspaceDataset)
  const used = [...usedBy.keys()]
    .filter((dataset) => dataset !== workspaceDataset && (known.size === 0 || known.has(dataset)))
    .map(entry)
  const unused = datasets
    .filter((dataset) => dataset !== workspaceDataset && !usedBy.has(dataset))
    .map(entry)

  return {
    current: matches(current) ? current : null,
    used: used.filter(matches).toSorted(byDataset),
    unused: unused.filter(matches).toSorted(byDataset),
  }
}

interface DatasetFieldProps {
  id: string
  mode: VisionDatasetMode
  /** The pinned dataset, shown (and pinned from) while following the workspace */
  dataset: string
  workspaceDataset: string
  datasets: readonly string[]
  onChange: (options: {datasetMode: VisionDatasetMode; dataset: string}) => void
}

/**
 * The dataset follows the workspace until one is pinned: picking another dataset in the menu, or
 * the pin button, pins one; picking the current workspace's dataset follows the workspace again.
 */
export function DatasetField({
  id,
  mode,
  dataset,
  workspaceDataset,
  datasets,
  onChange,
}: DatasetFieldProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const workspace = useWorkspace()
  const workspaces = useWorkspaces()
  const projectId = useVisionSelector(selectProjectId)
  const [query, setQuery] = useState('')
  const following = mode === 'workspace'
  const shownDataset = following ? workspaceDataset : dataset
  const toggleLabel = following
    ? t('vision.options.dataset.pin')
    : t('vision.options.dataset.use-workspace')
  const status = following
    ? t('vision.options.dataset.follows-workspace')
    : t('vision.options.dataset.pinned')

  const groups = useMemo(
    () => groupDatasets({datasets, workspaceDataset, workspaces, projectId, query}),
    [datasets, workspaceDataset, workspaces, projectId, query],
  )
  const isEmpty = !groups.current && groups.used.length === 0 && groups.unused.length === 0
  const currentWorkspaceTitle = workspace.title || workspace.name

  const pick = (next: string) =>
    onChange(
      next === workspaceDataset
        ? {datasetMode: 'workspace', dataset}
        : {datasetMode: 'pinned', dataset: next},
    )

  const renderItem = (entry: DatasetMenuEntry, subtitle: string | undefined) => {
    const selected = entry.dataset === shownDataset
    return (
      <MenuItem
        data-testid={`${id}-item-${entry.dataset}`}
        key={entry.dataset}
        onClick={() => pick(entry.dataset)}
        padding={3}
        pressed={selected}
        selected={selected}
      >
        <Flex alignItems="center" gap={3}>
          <Stack flex={1} gap={2}>
            <Text size={1} weight="medium" style={{color: 'var(--card-fg-color)'}}>
              {entry.dataset}
            </Text>
            {subtitle && (
              <Text
                size={0}
                style={{
                  color: 'var(--card-muted-fg-color)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {subtitle}
              </Text>
            )}
          </Stack>
          {selected && (
            <Text size={1} style={{color: 'var(--card-fg-color)'}}>
              <CheckmarkIcon />
            </Text>
          )}
        </Flex>
      </MenuItem>
    )
  }

  const sections = [
    {
      key: 'used',
      title: t('vision.options.dataset.used-by-workspaces'),
      entries: groups.used,
      subtitle: (entry: DatasetMenuEntry) => entry.workspaces.join(', '),
    },
    {
      key: 'unused',
      title: t('vision.options.dataset.unused'),
      entries: groups.unused,
      subtitle: () => undefined,
    },
  ].filter((section) => section.entries.length > 0)

  return (
    <Stack gap={2}>
      <Text as="label" htmlFor={id} muted size={1} weight="medium" trim={true}>
        {t('settings.dataset-label')}
      </Text>
      <Flex gap={1}>
        <Box flexBasis="0%" flexGrow={1} minWidth="0">
          <MenuButton
            button={
              <Button
                data-testid={`${id}-select`}
                fontSize={1}
                iconRight={ChevronDownIcon}
                justify="space-between"
                mode="ghost"
                padding={2}
                style={{width: '100%'}}
                text={shownDataset}
                textAlign="left"
                value={shownDataset}
              />
            }
            id={id}
            menu={
              <Menu data-testid={`${id}-menu`} padding={0} style={{minWidth: 280}}>
                <Box padding={2} borderBottom>
                  <TextInput
                    data-testid={`${id}-search`}
                    fontSize={1}
                    icon={SearchIcon}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setQuery(event.currentTarget.value)
                    }
                    placeholder={t('vision.options.dataset.search-placeholder')}
                    radius={2}
                    value={query}
                  />
                </Box>
                <Box overflowY="auto" padding={1} style={{maxHeight: 360}}>
                  {groups.current && (
                    <>
                      <Box paddingX={3} paddingTop={3} paddingBottom={2}>
                        <Text muted size={0} weight="medium">
                          {t('vision.options.dataset.current-workspace')}
                        </Text>
                      </Box>
                      {renderItem(groups.current, currentWorkspaceTitle)}
                    </>
                  )}
                  {sections.map((section, index) => (
                    <Fragment key={section.key}>
                      {(groups.current || index > 0) && <MenuDivider />}
                      <Box paddingX={3} paddingTop={3} paddingBottom={2}>
                        <Text muted size={0} weight="medium">
                          {section.title}
                        </Text>
                      </Box>
                      {section.entries.map((entry) => renderItem(entry, section.subtitle(entry)))}
                    </Fragment>
                  ))}
                  {isEmpty && (
                    <Box padding={3}>
                      <Text muted size={1}>
                        {t('vision.options.dataset.no-matches')}
                      </Text>
                    </Box>
                  )}
                </Box>
              </Menu>
            }
            onClose={() => setQuery('')}
            popover={{
              constrainSize: true,
              placement: 'bottom-start',
              portal: true,
              tone: 'default',
            }}
          />
        </Box>
        <Tooltip
          animate
          content={
            <Stack gap={2}>
              <Text muted size={1} as="div">
                {status}
              </Text>
              <Text size={1} as="div">
                {toggleLabel}
              </Text>
            </Stack>
          }
          placement="bottom"
          portal
        >
          <Button
            aria-label={toggleLabel}
            aria-pressed={!following}
            data-testid={`${id}-${following ? 'pin' : 'follow'}`}
            fontSize={1}
            icon={following ? PinIcon : PinRemovedIcon}
            mode="ghost"
            onClick={() =>
              onChange(
                following
                  ? {datasetMode: 'pinned', dataset: workspaceDataset}
                  : {datasetMode: 'workspace', dataset},
              )
            }
            padding={2}
          />
        </Tooltip>
      </Flex>
    </Stack>
  )
}
