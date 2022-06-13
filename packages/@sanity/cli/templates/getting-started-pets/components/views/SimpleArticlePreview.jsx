import { Heading, Text, Box, Flex, Card, TextInput } from "@sanity/ui";
import { BlockText } from "./BlockText";
import React from "react";
import PropTypes from "prop-types";

export function SimpleArticlePreview(props) {
  const doc = props.document.displayed;
  if (!doc) {
    return null;
  }
  console.log(doc.description);

  return (
    <Flex
      direction="column"
      justify="center"
      align="center"
      gap={5}
      padding={4}
    >
      <Heading align="center" as="h1">
        {doc.title}
      </Heading>

      {doc.body?.length && (
        <Card padding={2}>
          <BlockText value={doc.body} />
        </Card>
      )}
    </Flex>
  );
}

SimpleArticlePreview.propTypes = {
  document: PropTypes.shape({
    displayed: PropTypes.object,
    draft: PropTypes.object,
    published: PropTypes.object,
  }),
};
