import {Stack} from '@sanity/ui'
import styled, {css} from 'styled-components'
import React from 'react'
import {PortableText, PortableTextComponents} from '@portabletext/react'
import {CommentMessage} from '../../types'
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

const components: PortableTextComponents = {
  block: {
    normal: ({children}) => <NormalBlock>{children}</NormalBlock>,

    // Since we do not offer any formatting options, we can just use the normal block for all of these.
    h1: ({children}) => <NormalBlock>{children}</NormalBlock>,
    h2: ({children}) => <NormalBlock>{children}</NormalBlock>,
    h3: ({children}) => <NormalBlock>{children}</NormalBlock>,
    h4: ({children}) => <NormalBlock>{children}</NormalBlock>,
    h5: ({children}) => <NormalBlock>{children}</NormalBlock>,
    h6: ({children}) => <NormalBlock>{children}</NormalBlock>,
    blockquote: ({children}) => <NormalBlock>{children}</NormalBlock>,
    code: ({children}) => <NormalBlock>{children}</NormalBlock>,
    ul: ({children}) => <NormalBlock>{children}</NormalBlock>,
    ol: ({children}) => <NormalBlock>{children}</NormalBlock>,
    li: ({children}) => <NormalBlock>{children}</NormalBlock>,
  },
  marks: {
    // Since we do not offer any formatting options, we can just use the normal block for all of these.
    strong: ({children}) => <>{children}</>,
    em: ({children}) => <>{children}</>,
    code: ({children}) => <>{children}</>,
    underline: ({children}) => <>{children}</>,
    strikeThrough: ({children}) => <>{children}</>,
  },
  types: {
    mention: (props) => {
      return <MentionInlineBlock userId={props?.value?.userId} selected={false} />
    },
  },
}

interface PortableTextSerializerProps {
  blocks: CommentMessage
}

/**
 * @beta
 * @hidden
 */
export function CommentMessageSerializer(props: PortableTextSerializerProps) {
  const {blocks} = props

  return (
    <PortableTextWrap>
      <PortableText value={blocks || []} components={components} />
    </PortableTextWrap>
  )
}
