import React, {useMemo} from 'react'
import {Box, Stack, Label, Heading} from '@sanity/ui'
import PropTypes from 'prop-types'
import {BlockText} from './BlockText'
import styled from 'styled-components'
import {useListenForRef} from '../../plugins/listening-query/listening-query-hook'
import {Layout} from './components/layout'
import {MetadataList} from './components'

/* This will fetch the content, and will include the draft if it exists
The content, in this case will be split into different properties from the article schema:
author (human) and body of the article (Portable Text Editor) 
  Documentation: https://www.sanity.io/docs/data-listening-query */
const query = `* [_id == "drafts." + $id || _id == $id]{
    ...,
    "author": author{
      ...(* [_type == "human" && _id == "drafts." + ^._ref || _id == ^._ref]| order(_updatedAt desc) [0])
    },
    body[]{
      ...,
      _type == "products" => { 
        ...,
        "products": products[] {
          ...(* [_type == "product" && _id == "drafts." + ^._ref || _id == ^._ref]| order(_updatedAt desc) [0])
        },
      }
    }
  } | order(_updatedAt desc) [0]
`

/**
 * Renders the currently displayed document as a
 * simple little "webpage" using:
 * - @sanity/ui
 * - @portabletext/react
 * - @sanity/image-url
 */
export function ArticlePreview(props) {
  const document = props.document.displayed
  if (!document) {
    return null
  }
  return <ArticlePreviewInner document={document} />
}

function ArticlePreviewInner({document}) {
  const resolvedDocument = useListenForRef(document?._id, query) // fetch the draft or published document with the current doc id and the query
  const {title, author, body, _createdAt} = resolvedDocument || {}
  const formattedAuthorAndDate = useMemo(() => {
    const parts = []
    if (!_createdAt && !author) {
      return null
    }

    if (author) {
      parts.push(author.name)
    }

    if (_createdAt) {
      parts.push(
        new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'long',
          day: '2-digit',
        }).format(new Date(_createdAt))
      )
    }

    return parts.join(', ')
  }, [author, _createdAt])

  const metadata = useMemo(() => {
    const metadataList = []

    if (_createdAt) {
      metadataList.push({
        title: 'Published',
        value: new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'long',
          day: '2-digit',
        }).format(new Date(_createdAt)),
      })
    }

    if (author) {
      metadataList.push({
        title: 'By',
        image: author?.picture,
        imageCaption: author?.name,
      })
    }

    return metadataList
  }, [author, _createdAt])

  return (
    <Layout>
      <Header
        display="flex"
        direction="column"
        align="flex-end"
        justify="space-between"
        padding={4}
        paddingBottom={5}
        sizing="border"
        marginBottom={5}
      >
        {formattedAuthorAndDate && (
          <Box marginBottom={3}>
            <Label as="p">{formattedAuthorAndDate}</Label>
          </Box>
        )}
        <Heading as="h1" size={4}>
          {title ?? 'Gimme a title!'}
        </Heading>
      </Header>

      <Stack space={5} paddingX={4}>
        {body?.length && <BlockText value={body} />}

        {metadata.length > 0 && <MetadataList items={metadata} />}
      </Stack>
    </Layout>
  )
}

ArticlePreview.propTypes = {
  document: PropTypes.shape({
    displayed: PropTypes.object,
    draft: PropTypes.object,
    published: PropTypes.object,
  }),
}

const Header = styled(Box)`
  background-color: #ffd6c8;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;

  * {
    color: #cd4b1f;
  }
`
