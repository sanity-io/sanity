import {useVistaSelector} from '../store/VistaActorContext'
import {selectOpenDialog} from '../store/vistaMachine'
import {ShortcutsDialog} from './sidebar/ShortcutsDialog'

export function VistaDialogs() {
  const dialog = useVistaSelector(selectOpenDialog)
  return dialog === 'shortcuts' ? <ShortcutsDialog /> : null
}
