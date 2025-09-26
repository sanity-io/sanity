import {type FC, memo, useEffect} from 'react'

import {type VisualEditingConnection} from './types'
import {useDecideParameters} from './useDecideParameters'

export interface PostMessageDecideParametersProps {
  comlink: VisualEditingConnection
}

const PostMessageDecideParameters: FC<PostMessageDecideParametersProps> = (props) => {
  const {comlink} = props
  const {decideParameters} = useDecideParameters()

  console.warn(
    '[PostMessageDecideParameters] Component rendered with decideParameters:',
    decideParameters,
  )

  // Return the decideParameters when requested
  useEffect(() => {
    console.warn('[PostMessageDecideParameters] Setting up fetch-decide-parameters listener')
    return comlink.on('visual-editing/fetch-decide-parameters', () => {
      console.warn(
        '[PostMessageDecideParameters] Received fetch-decide-parameters request, returning:',
        decideParameters,
      )
      return {
        decideParameters: JSON.stringify(decideParameters),
      }
    })
  }, [comlink, decideParameters])

  // Dispatch a decideParameters message when the parameters change
  useEffect(() => {
    console.warn(
      '[PostMessageDecideParameters] Posting decide-parameters update:',
      decideParameters,
    )
    comlink.post('presentation/decide-parameters', {
      decideParameters: JSON.stringify(decideParameters),
    })
  }, [comlink, decideParameters])

  return null
}

export default memo(PostMessageDecideParameters)
