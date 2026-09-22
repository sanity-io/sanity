import {useVistaSelector} from '../store/VistaActorContext'
import {selectOpenDialog} from '../store/vistaMachine'
import {SettingsDialog} from './sidebar/SettingsDialog'
import {ShortcutsDialog} from './sidebar/ShortcutsDialog'

export function VistaDialogs({datasets}: {datasets: string[]}) {
  const dialog = useVistaSelector(selectOpenDialog)

  if (dialog === 'shortcuts') {
    return <ShortcutsDialog />
  }
  if (dialog === 'settings') {
    return <SettingsDialog datasets={datasets} />
  }
  return null
}
