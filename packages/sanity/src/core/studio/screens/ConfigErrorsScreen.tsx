import i18n from 'i18next'
import k from './../../../i18n/keys'
import React from 'react'

// const Root = styled(Card).attrs({height: 'fill', overflow: 'auto'})``
// const Content = styled(Box).attrs({padding: 4})`
//   margin: auto;
//   width: 640px;
//   max-width: 100%;
// `

export function ConfigErrorsScreen() {
  return <>{i18n.t(k.TODO_IMPLEMENT_CONFIG_ERRORS)}</>
  // return (
  //   <Root forwardedAs={Flex}>
  //     <Content forwardedAs={Flex} direction="column" gap={4}>
  //       <Flex direction="column" gap={2}>
  //         <Box>
  //           <Heading as="h1">Configuration Error</Heading>
  //         </Box>
  //         <Box muted>
  //           <Text>An error occurred while trying to resolve your Studio's configuration.</Text>
  //         </Box>
  //         <Box>
  //           <Text size={1} muted>
  //             Note: the design of this page may change.
  //           </Text>
  //         </Box>
  //       </Flex>
  //       <Card shadow={1}>
  //         {errors.map((errorInfo, index) => (
  //           // eslint-disable-next-line react/no-array-index-key
  //           <ErrorMessage key={index} {...errorInfo} />
  //         ))}
  //       </Card>
  //       <Button
  //         tone="primary"
  //         // eslint-disable-next-line react/jsx-no-bind
  //         onClick={() => window.location.reload()}
  //         type="button"
  //         text="Retry"
  //       />
  //     </Content>
  //   </Root>
  // )
}
