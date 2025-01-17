import {useState} from 'react'
import {v4 as uuid} from 'uuid'

export function usePanelId(id?: string): string {
  const [panelId] = useState(() => id || uuid())
  return panelId
}
