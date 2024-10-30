import {useCallback, useState} from 'react'

import {
  type EditableReleaseDocument,
  type ReleaseDocument,
  useReleaseOperations,
} from '../../../store'
import {ReleaseInputsForm} from '../../components/dialog/ReleaseInputsForm'

export function ReleaseDetailsEditor({release}: {release: ReleaseDocument}): JSX.Element {
  const {updateRelease} = useReleaseOperations()
  const [timer, setTimer] = useState<NodeJS.Timeout | undefined>(undefined)

  const handleOnChange = useCallback(
    (changedValue: EditableReleaseDocument) => {
      clearTimeout(timer)

      const newTimer = setTimeout(() => {
        updateRelease(changedValue)
      }, 200)

      setTimer(newTimer)
    },
    [timer, updateRelease],
  )

  return <ReleaseInputsForm release={release} onChange={handleOnChange} />
}
