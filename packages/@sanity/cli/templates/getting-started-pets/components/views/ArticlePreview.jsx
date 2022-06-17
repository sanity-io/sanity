import React from "react";
import { Box, Stack, Flex, Grid, Label, Heading, Text, Card } from "@sanity/ui";
import PropTypes from "prop-types";
import { urlFor } from "../../helpers/image-url-builder";
import { BlockText } from "./BlockText";
import styled from "styled-components";
import {
  useIdPair,
  useListeningQuery,
} from "../../plugins/listening-query/listening-query-hook";
import { Layout } from "./components/layout";

const blockJoins = `
  {
    ...,
    "author": author->,
    body[]{
      ...,
      _type == "products" => { 
        ...,
        "products": @.products[]->
      }
    }
  }
`;

function queryFor({ draftId, publishedId }) {
  return draftId || publishedId
    ? `{
    ${draftId ? `"draft": *[_id == $draftId][0]${blockJoins},` : ""}
    ${publishedId ? `"published": *[_id == $id][0]${blockJoins},` : ""}
  }`
    : undefined;
}

function useListenForRef(id) {
  const ids = useIdPair(id);
  const query = queryFor(ids);
  const { data } = useListeningQuery(query, ids);

  const { draft, published } = data ?? {};
  return draft ?? published;
}

/**
 * Renders the currently displayed document as a
 * simple little "webpage" using:
 * - @sanity/ui
 * - @portabletext/react
 * - @sanity/image-url
 */
export function ArticlePreview(props) {
  const document = props.document.displayed;
  if (!document) {
    return null;
  }
  return <ArticlePreviewInner document={document} />;
}

function ArticlePreviewInner({ document }) {
  const resolvedDocument = useListenForRef(document?._id);

  if (!resolvedDocument) {
    return null;
  }

  return (
    <Layout>
        <Header
          display="flex"
          direction="column"
          align="flex-end"
          justify="space-between"
          padding={5}
          sizing="border"
        >
          <Heading as="h1" size={4}>
            {resolvedDocument.title ?? "Gimme a title!"}
          </Heading>
        </Header>

        {resolvedDocument.body?.length && (
          <Card padding={5}>
            <BlockText value={resolvedDocument.body} />
          </Card>
        )}

        {resolvedDocument && (
          <Card marginBottom={5}>
            <Box paddingY={4}>
              <Text align="center">***</Text>
            </Box>
            <Grid columns={2} gap={4}>
              <Box>
                <Stack space={3}>
                  <Label>Published</Label>
                  <Text weight="bold">{resolvedDocument._createdAt}</Text>
                </Stack>
              </Box>
              <Box>
                <Stack space={3}>
                  <Label>By</Label>
                  <Text weight="bold">{resolvedDocument._createdAt}</Text>
                </Stack>
              </Box>
            </Grid>
          </Card>
        )}
    </Layout>
  );
}

ArticlePreview.propTypes = {
  document: PropTypes.shape({
    displayed: PropTypes.object,
    draft: PropTypes.object,
    published: PropTypes.object,
  }),
};

const Header = styled(Box)`
  background-color: #ffd6c8;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;

  * {
    color: #cd4b1f;
  }
`;
