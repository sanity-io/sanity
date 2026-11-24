import {Stack} from '@sanity/ui'
import {useMemo, useRef, useState} from 'react'
import {type WorkspaceSummary} from 'sanity'
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
  /** Datasets of this project's workspaces, in the workspace switcher's order */
  workspace: DatasetMenuEntry[]
  /** The project's remaining datasets, by name */
  other: DatasetMenuEntry[]
}

/**
 * The dataset menu's groups after Auto, which stands for the workspace's dataset and so is in
 * neither: the datasets of this project's workspaces, in the workspace switcher's order and
 * listed once each where the switcher first shows them, then the project's other datasets by
 * name. The query matches dataset names and workspace titles in both groups.
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

  // Without the dataset list, the datasets the workspaces use are all there is to offer
  const known = new Set(datasets.length > 0 ? datasets : usedBy.keys())
  const matches = ({dataset, workspaces: titles}: DatasetMenuEntry) =>
    !query ||
    dataset.toLowerCase().includes(query) ||
    titles.some((title) => title.toLowerCase().includes(query))

  const workspace = [...usedBy.keys()]
    .filter((dataset) => dataset !== workspaceDataset && known.has(dataset))
    .map((dataset) => ({dataset, workspaces: usedBy.get(dataset) ?? []}))
  const other = [...known]
    .filter((dataset) => dataset !== workspaceDataset && !usedBy.has(dataset))
    .toSorted((a, b) => a.localeCompare(b))
    .map((dataset) => ({dataset, workspaces: []}))
  return {workspace: workspace.filter(matches), other: other.filter(matches)}
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

/**
 * The dataset menu. Auto, the first and default option, queries the workspace's dataset and
 * follows it when the workspace changes, so the workspace's dataset has no item of its own;
 * picking another dataset overrides it until Auto is picked again.
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
  const workspaces = useWorkspaces()
  const projectId = useVisionSelector(selectProjectId)
  const [query, setQuery] = useState('')
  // The workspace's dataset is only listed as Auto, so a tab pinned to it (saved before, or
  // pinned in another workspace) shows Auto checked rather than no selection
  const isAuto = mode === 'auto' || dataset === workspaceDataset
  const autoTitle = t('vision.options.auto')
  const autoSubtitle = t('vision.options.dataset.auto.subtitle', {dataset: workspaceDataset})

  const groups = useMemo(
    () => groupDatasets({datasets, workspaceDataset, workspaces, projectId, query}),
    [datasets, workspaceDataset, workspaces, projectId, query],
  )
  const foldRef = useRef<HTMLDivElement>(null)
  const normalizedQuery = query.trim().toLowerCase()
  const showAuto =
    !normalizedQuery ||
    autoTitle.toLowerCase().includes(normalizedQuery) ||
    workspaceDataset.toLowerCase().includes(normalizedQuery)
  const renderItem = (entry: DatasetMenuEntry) => (
    <OptionMenuItem
      key={entry.dataset}
      onClick={() => onChange({datasetMode: 'override', dataset: entry.dataset})}
      selected={!isAuto && entry.dataset === dataset}
      subtitle={entry.workspaces.length > 0 ? entry.workspaces.join(', ') : undefined}
      testId={`${id}-item-${entry.dataset}`}
      title={entry.dataset}
    />
  )

  return (
    <Stack gap={2}>
      <Text as="label" htmlFor={elementId} muted size={1} weight="medium" trim={true}>
        {t('settings.dataset-label')}
      </Text>
      <OptionMenuButton
        foldRef={foldRef}
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
              onClick={() => onChange({datasetMode: 'auto', dataset: workspaceDataset})}
              selected={isAuto}
              subtitle={autoSubtitle}
              testId={`${id}-item-auto`}
              title={autoTitle}
            />
          </OptionMenuSection>
        )}
        {groups.workspace.length > 0 && (
          <OptionMenuSection
            ref={foldRef}
            testId={`${id}-group-workspace`}
            title={t('vision.options.dataset.workspace-datasets')}
          >
            {groups.workspace.map(renderItem)}
          </OptionMenuSection>
        )}
        {groups.other.length > 0 && (
          <OptionMenuSection
            testId={`${id}-group-other`}
            title={t('vision.options.dataset.other-datasets')}
          >
            {groups.other.map(renderItem)}
          </OptionMenuSection>
        )}
        {!showAuto && groups.workspace.length === 0 && groups.other.length === 0 && (
          <OptionMenuNoMatches>{t('vision.options.dataset.no-matches')}</OptionMenuNoMatches>
        )}
      </OptionMenuButton>
    </Stack>
  )
}
