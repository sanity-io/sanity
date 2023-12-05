import {useToast} from '@sanity/ui'
import React from 'react'
import {DelayedSpinner} from '../components/DelayedSpinner'
import {VisionGui} from '../components/VisionGui'
import {useDatasets} from '../hooks/useDatasets'
import type {VisionProps} from '../types'

export function VisionContainer(props: VisionProps) {
  const toast = useToast()
  const loadedDatasets = useDatasets(props.client)

  if (!loadedDatasets) {
    return <DelayedSpinner />
  }

  const datasets =
    loadedDatasets instanceof Error
      ? // On error, use the clients configured dataset
        [props.client.config().dataset || 'production']
      : // Otherwise use the loaded list, obviously
        loadedDatasets

  return <VisionGui {...props} datasets={datasets} toast={toast} />
}
