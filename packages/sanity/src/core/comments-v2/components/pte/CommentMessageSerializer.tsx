import {PortableText, type PortableTextComponents} from '@portabletext/react'
import {Fragment, type PropsWithChildren, useMemo} from 'react'
import {VStack} from 'ui5'

import {type CommentMessage} from '../../types'
import {transformChildren} from '../../utils/transform-children'
import {MentionInlineBlock} from './blocks/MentionInlineBlock'
import {NormalBlock} from './blocks/NormalBlock'
import {portableTextWrap} from './CommentMessageSerializer.css'

const EMPTY_ARRAY: [] = []

function NormalBlockTransformed(props: PropsWithChildren) {
  const children = useMemo(() => transformChildren(props.children), [props.children])

  return <NormalBlock>{children}</NormalBlock>
}

const components: PortableTextComponents = {
  // Since we do not offer any formatting options, we can just use the normal block for all of these.
  block: {
    normal: NormalBlockTransformed,
    h1: NormalBlockTransformed,
    h2: NormalBlockTransformed,
    h3: NormalBlockTransformed,
    h4: NormalBlockTransformed,
    h5: NormalBlockTransformed,
    h6: NormalBlockTransformed,
    blockquote: NormalBlockTransformed,
    code: NormalBlockTransformed,
  },

  list: {
    bullet: Fragment,
    number: Fragment,
    checkmarks: Fragment,
  },

  listItem: {
    bullet: NormalBlockTransformed,
    number: NormalBlockTransformed,
    checkmarks: NormalBlockTransformed,
  },

  // Since we do not offer any formatting options, we can just use the normal block for all of these.
  marks: {
    strong: Fragment,
    em: Fragment,
    code: Fragment,
    underline: Fragment,
    strikeThrough: Fragment,
    link: Fragment,
  },

  types: {
    mention: (props) => {
      return <MentionInlineBlock userId={props?.value?.userId} selected={false} />
    },
  },
}

interface CommentMessageSerializerProps {
  blocks: CommentMessage
}

/**
 * @beta
 * @hidden
 */
export function CommentMessageSerializer(props: CommentMessageSerializerProps): React.JSX.Element {
  const {blocks} = props

  return (
    <VStack className={portableTextWrap}>
      <PortableText value={blocks || EMPTY_ARRAY} components={components} />
    </VStack>
  )
}
