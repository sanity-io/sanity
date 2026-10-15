import {useVistaSelector} from '../store/VistaActorContext'
import {selectOpenDialog} from '../store/vistaMachine'
import {SettingsDialog} from './sidebar/SettingsDialog'
import {ShortcutsDialog} from './sidebar/ShortcutsDialog'
import {GenerateQueryDialog} from './tabs/GenerateQueryDialog'

export function VistaDialogs() {
  const dialog = useVistaSelector(selectOpenDialog)

  if (dialog === 'shortcuts') {
    return <ShortcutsDialog />
  }
  if (dialog === 'settings') {
    return <SettingsDialog />
  }
  if (dialog === 'generate') {
    return <GenerateQueryDialog />
  }
  return null
}
