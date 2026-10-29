import {type CommentInputRenderBlock} from '../../../../../../comments/components/pte/comment-input/CommentInput'
import {DescriptionInputBlock} from '../blocks/DescriptionInputBlock'

export const renderBlock: CommentInputRenderBlock = (props) => {
  const {children} = props

  return <DescriptionInputBlock>{children}</DescriptionInputBlock>
}
