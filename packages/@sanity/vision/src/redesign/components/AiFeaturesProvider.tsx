import {type ReactNode, useMemo} from 'react'

import {type VisionAiConfig} from '../../types'
import {
  AiFeaturesContext,
  ConfiguredAiFeaturesContext,
  resolveAiFeatures,
  resolveEffectiveAiFeatures,
} from '../aiFeatures'
import {useVisionSelector} from '../store/VisionActorContext'

/** The AI features the config leaves on, less those the user switched off in the settings */
export function AiFeaturesProvider(props: {ai: VisionAiConfig | undefined; children: ReactNode}) {
  const {ai, children} = props
  const configured = useMemo(() => resolveAiFeatures(ai), [ai])
  const settings = useVisionSelector((snapshot) => snapshot.context.ai)
  const features = useMemo(
    () => resolveEffectiveAiFeatures(configured, settings),
    [configured, settings],
  )
  return (
    <ConfiguredAiFeaturesContext.Provider value={configured}>
      <AiFeaturesContext.Provider value={features}>{children}</AiFeaturesContext.Provider>
    </ConfiguredAiFeaturesContext.Provider>
  )
}
