import {PortableText, type PortableTextComponents} from '@portabletext/react'
import {Stack} from '@sanity/ui'
import {Fragment, type PropsWithChildren, useMemo} from 'react'
import {css, styled} from 'styled-components'

import {type CommentMessage} from '../../types'
import {transformChildren} from '../../utils'
import {MentionInlineBlock, NormalBlock} from './blocks'

const PortableTextWrap = styled(Stack)(() => {
  return css`
    & > [data-ui='Text']:not(:first-child) {
      margin-top: 1em; // todo: improve
    }

    & > [data-ui='Text']:has(> span:empty) {
      display: none;
    }
  `
})

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
    <PortableTextWrap>
      <PortableText value={blocks || EMPTY_ARRAY} components={components} />
    </PortableTextWrap>
  )
}
