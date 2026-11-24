import {Stack} from '@sanity/ui'
import {useMemo, useState} from 'react'
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

/**
 * The project's datasets other than the workspace's, which Auto stands for, in name order with
 * the workspaces that use each; the query matches dataset names and workspace titles
 */
export function listOtherDatasets(options: {
  datasets: readonly string[]
  workspaceDataset: string
  workspaces: readonly Pick<WorkspaceSummary, 'name' | 'title' | 'dataset' | 'projectId'>[]
  projectId: string
  query: string
}): DatasetMenuEntry[] {
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
  const known = datasets.length > 0 ? datasets : [...usedBy.keys()]
  return [...new Set(known)]
    .filter((dataset) => dataset !== workspaceDataset)
    .map((dataset) => ({dataset, workspaces: usedBy.get(dataset) ?? []}))
    .filter(
      ({dataset, workspaces: titles}) =>
        !query ||
        dataset.toLowerCase().includes(query) ||
        titles.some((title) => title.toLowerCase().includes(query)),
    )
    .toSorted((a, b) => a.dataset.localeCompare(b.dataset))
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

  const others = useMemo(
    () => listOtherDatasets({datasets, workspaceDataset, workspaces, projectId, query}),
    [datasets, workspaceDataset, workspaces, projectId, query],
  )
  const normalizedQuery = query.trim().toLowerCase()
  const showAuto =
    !normalizedQuery ||
    autoTitle.toLowerCase().includes(normalizedQuery) ||
    workspaceDataset.toLowerCase().includes(normalizedQuery)

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
              onClick={() => onChange({datasetMode: 'auto', dataset: workspaceDataset})}
              selected={isAuto}
              subtitle={autoSubtitle}
              testId={`${id}-item-auto`}
              title={autoTitle}
            />
          </OptionMenuSection>
        )}
        {others.length > 0 && (
          <OptionMenuSection title={t('vision.options.dataset.other-datasets')}>
            {others.map((entry) => (
              <OptionMenuItem
                key={entry.dataset}
                onClick={() => onChange({datasetMode: 'override', dataset: entry.dataset})}
                selected={!isAuto && entry.dataset === dataset}
                subtitle={entry.workspaces.length > 0 ? entry.workspaces.join(', ') : undefined}
                testId={`${id}-item-${entry.dataset}`}
                title={entry.dataset}
              />
            ))}
          </OptionMenuSection>
        )}
        {!showAuto && others.length === 0 && (
          <OptionMenuNoMatches>{t('vision.options.dataset.no-matches')}</OptionMenuNoMatches>
        )}
      </OptionMenuButton>
    </Stack>
  )
}
