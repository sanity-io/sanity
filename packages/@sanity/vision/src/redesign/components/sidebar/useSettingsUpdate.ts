import {useCallback} from 'react'

import {useVisionTelemetry} from '../../../__telemetry__/useVisionTelemetry'
import {type VisionSettingsSection} from '../../../__telemetry__/vision.telemetry'
import {useVisionActor} from '../../store/VisionActorContext'
import {type VisionEvent} from '../../store/visionMachine'

type VisionSettingsEvent = Extract<
  VisionEvent,
  {
    type:
      | 'settings.update'
      | 'historyDiff.update'
      | 'ai.update'
      | 'editor.update'
      | 'response.update'
      | 'exportSnippets.update'
  }
>

const SETTINGS_SECTIONS: Record<VisionSettingsEvent['type'], VisionSettingsSection> = {
  'settings.update': 'defaults',
  'historyDiff.update': 'history-diff',
  'ai.update': 'ai',
  'editor.update': 'editor',
  'response.update': 'response',
  'exportSnippets.update': 'export-snippets',
}

/**
 * Sends a settings change made in the settings drawer, and records which section it was made in.
 * Pass `record: false` for a change that is recorded once it is done, like a field being typed in.
 */
export function useSettingsUpdate(): (
  event: VisionSettingsEvent,
  options?: {record?: boolean},
) => void {
  const actorRef = useVisionActor()
  const telemetry = useVisionTelemetry()
  return useCallback(
    (event, options) => {
      if (options?.record !== false) telemetry.settingsChanged(SETTINGS_SECTIONS[event.type])
      actorRef.send(event)
    },
    [actorRef, telemetry],
  )
}
