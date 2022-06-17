import React from "react";
import { Box, Stack, Flex, Grid, Label, Heading, Text, Card } from "@sanity/ui";
import styled from "styled-components";
import { PreviewWrapper } from "../PreviewWrapper";

export function Layout({ children }) {
  return (
    <Container padding={5}>
      <PreviewWrapper>{children}</PreviewWrapper>
    </Container>
  );
}

const Container = styled(Box)`
  width: 500px;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
`;
