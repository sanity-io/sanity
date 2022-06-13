import React from 'react'
import {Stack, Flex, Label, Heading, Text, Card} from "@sanity/ui";
import PropTypes from 'prop-types';
import {urlFor} from "../../helpers/image-url-builder";
import {BlockText} from "./BlockText";

/**
 * Renders thecurrently displayed document as formatted JSON as a
 * simple little "webpage" using:
 * - @sanity/ui
 * - @portabletext/react
 * - @sanity/image-url
 */
export function SimpleDogPreview(props) {
  const doc = props.document.displayed;
  if (!doc) {
    return null
  }

  return (
    <Flex direction="column" justify="center" align="center" gap={5} padding={4}>
      <Heading size={4}>{doc.name ?? 'Gimme a name!'}</Heading>

      <Stack space={4}>
        <Flex gap={4} align="center" justify="center">
          <Label>Birth</Label>
          <Text>{doc.birthday ?? 'Not born yet :('}</Text>
        </Flex>
        <Flex gap={4} align="center" justify="center">
          <Label>Weight</Label>
          <Text>{doc.weight ? `${doc.weight}kg` : 'Nobody knows?'}</Text>
        </Flex>
      </Stack>

      <Flex direction="column" justify="center" align="center">
        {doc.picture?.asset ?
          <Card>
            <img src={urlFor(doc.picture).width(128).height(128).url()}
                 alt={doc.picture?.alt ?? ''}
                 style={{borderRadius: '50%'}}
            />
          </Card> :
          <Text>No picture today.</Text>
        }
      </Flex>

      {doc.description?.length &&
        (
          <Card shadow={1} padding={2}>
            <BlockText value={doc.description}/>
          </Card>
        )
      }

    </Flex>
  )
}

SimpleDogPreview.propTypes = {
  document: PropTypes.shape({
    displayed: PropTypes.object,
    draft: PropTypes.object,
    published: PropTypes.object
  }),
};