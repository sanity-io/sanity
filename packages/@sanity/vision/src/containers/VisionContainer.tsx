import {extractSchema} from '@sanity/schema'
import {useToast} from '@sanity/ui'
import {useMemo} from 'react'
import {useTranslation, useWorkspace} from 'sanity'

import {DelayedSpinner} from '../components/DelayedSpinner'
import {VisionGui} from '../components/VisionGui'
import {useDatasets} from '../hooks/useDatasets'
import {visionLocaleNamespace} from '../i18n'
import {type VisionProps} from '../types'

export function VisionContainer(props: VisionProps) {
  const toast = useToast()
  const loadedDatasets = useDatasets(props.client)
  const workspace = useWorkspace()
  const extractedSchema = useMemo(() => extractSchema(workspace.schema, {}), [workspace.schema])
  const {t} = useTranslation(visionLocaleNamespace)

  if (!loadedDatasets) {
    return <DelayedSpinner />
  }

  const datasets =
    loadedDatasets instanceof Error
      ? // On error, use the clients configured dataset
        [props.client.config().dataset || 'production']
      : // Otherwise use the loaded list, obviously
        loadedDatasets

  return (
    <VisionGui
      {...props}
      datasets={datasets}
      toast={toast}
      t={t}
      workspace={workspace}
      schema={extractedSchema}
    />
  )
}
