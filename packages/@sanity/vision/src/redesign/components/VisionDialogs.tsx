import {useVisionSelector} from '../store/VisionActorContext'
import {selectOpenDialog} from '../store/visionMachine'
import {ShortcutsDialog} from './sidebar/ShortcutsDialog'

export function VisionDialogs() {
  const dialog = useVisionSelector(selectOpenDialog)
  return dialog === 'shortcuts' ? <ShortcutsDialog /> : null
}
