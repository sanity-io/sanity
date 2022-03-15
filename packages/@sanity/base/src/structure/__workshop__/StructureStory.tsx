import React, {useMemo} from 'react'
import {useStructureBuilder} from '../useStructureBuilder'

export default function StructureStory() {
  const S = useStructureBuilder()

  const structure = useMemo(() => S.defaults().serialize(), [S])

  // eslint-disable-next-line no-console
  console.log('structure', structure)

  return <div>{JSON.stringify(null, null, 2)}</div>
}
