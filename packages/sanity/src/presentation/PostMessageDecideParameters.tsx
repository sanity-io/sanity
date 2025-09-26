import {type FC, memo, useEffect} from 'react'

import {type VisualEditingConnection} from './types'
import {useDecideParameters} from './useDecideParameters'

export interface PostMessageDecideParametersProps {
  comlink: VisualEditingConnection
}

const PostMessageDecideParameters: FC<PostMessageDecideParametersProps> = (props) => {
  const {comlink} = props
  const {decideParameters} = useDecideParameters()

  // Return the decideParameters when requested
  useEffect(() => {
    return comlink.on('visual-editing/fetch-decide-parameters', () => {
      return {
        decideParameters: JSON.stringify(decideParameters),
      }
    })
  }, [comlink, decideParameters])

  // Dispatch a decideParameters message when the parameters change
  useEffect(() => {
    comlink.post('presentation/decide-parameters', {
      decideParameters: JSON.stringify(decideParameters),
    })
  }, [comlink, decideParameters])

  return null
}

export default memo(PostMessageDecideParameters)
