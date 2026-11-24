import {DatabaseIcon} from '@sanity/icons/Database'
import {SyncIcon} from '@sanity/icons/Sync'
import {Stack} from '@sanity/ui'
import {useMemo, useState} from 'react'
import {useWorkspace, type WorkspaceSummary} from 'sanity'
import {useWorkspaces} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'
import {useTranslation} from 'sanity/i18n'
import {Text} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {type VisionDatasetMode} from '../../store/types'
import {useVisionSelector} from '../../store/VisionActorContext'
import {selectProjectId} from '../../store/visionMachine'
import {useTabElementId} from '../tabs/queryTabShown'
import {
  OptionMenuButton,
  OptionMenuItem,
  OptionMenuNoMatches,
  OptionMenuSection,
} from './OptionMenu'

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
  /** The overriding dataset, used while `mode` is `override` */
  dataset: string
  workspaceDataset: string
  datasets: readonly string[]
  onChange: (options: {datasetMode: VisionDatasetMode; dataset: string}) => void
}

const datasetIcon = (
  <Text size={1}>
    <DatabaseIcon />
  </Text>
)
const autoIcon = (
  <Text size={1}>
    <SyncIcon />
  </Text>
)

/**
 * The dataset menu. Auto, the first and default option, queries the workspace's dataset and
 * follows it when the workspace changes; picking a dataset, the workspace's included, overrides
 * it until Auto is picked again.
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
  const elementId = useTabElementId()(id)
  const workspace = useWorkspace()
  const workspaces = useWorkspaces()
  const projectId = useVisionSelector(selectProjectId)
  const [query, setQuery] = useState('')
  const isAuto = mode === 'auto'
  const autoTitle = t('vision.options.auto')
  const autoSubtitle = t('vision.options.dataset.auto.subtitle', {dataset: workspaceDataset})

  const groups = useMemo(
    () => groupDatasets({datasets, workspaceDataset, workspaces, projectId, query}),
    [datasets, workspaceDataset, workspaces, projectId, query],
  )
  const normalizedQuery = query.trim().toLowerCase()
  const showAuto =
    !normalizedQuery ||
    autoTitle.toLowerCase().includes(normalizedQuery) ||
    workspaceDataset.toLowerCase().includes(normalizedQuery)
  const isEmpty =
    !showAuto && !groups.current && groups.used.length === 0 && groups.unused.length === 0
  const currentWorkspaceTitle = workspace.title || workspace.name

  const renderItem = (entry: DatasetMenuEntry, subtitle: string | undefined) => (
    <OptionMenuItem
      icon={datasetIcon}
      key={entry.dataset}
      onClick={() => onChange({datasetMode: 'override', dataset: entry.dataset})}
      selected={!isAuto && entry.dataset === dataset}
      subtitle={subtitle}
      testId={`${id}-item-${entry.dataset}`}
      title={entry.dataset}
    />
  )

  const sections = [
    {
      key: 'current',
      title: t('vision.options.dataset.current-workspace'),
      entries: groups.current ? [groups.current] : [],
      subtitle: () => currentWorkspaceTitle,
    },
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
      <Text as="label" htmlFor={elementId} muted size={1} weight="medium" trim={true}>
        {t('settings.dataset-label')}
      </Text>
      <OptionMenuButton
        id={elementId}
        onClose={() => setQuery('')}
        onSearchQueryChange={setQuery}
        searchPlaceholder={t('vision.options.dataset.search-placeholder')}
        searchQuery={query}
        testId={id}
        text={isAuto ? t('vision.options.auto.button', {name: workspaceDataset}) : dataset}
        value={isAuto ? workspaceDataset : dataset}
      >
        {showAuto && (
          <OptionMenuSection>
            <OptionMenuItem
              icon={autoIcon}
              onClick={() => onChange({datasetMode: 'auto', dataset: workspaceDataset})}
              selected={isAuto}
              subtitle={autoSubtitle}
              testId={`${id}-item-auto`}
              title={autoTitle}
            />
          </OptionMenuSection>
        )}
        {sections.map((section) => (
          <OptionMenuSection key={section.key} title={section.title}>
            {section.entries.map((entry) => renderItem(entry, section.subtitle(entry)))}
          </OptionMenuSection>
        ))}
        {isEmpty && (
          <OptionMenuNoMatches>{t('vision.options.dataset.no-matches')}</OptionMenuNoMatches>
        )}
      </OptionMenuButton>
    </Stack>
  )
}
