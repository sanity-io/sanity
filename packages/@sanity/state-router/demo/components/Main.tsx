import {RouteScope, RouterState, useLink, useStateLink, withRouter} from '@sanity/state-router'
import {Button, ButtonProps, Card, Code, Container, Grid, Heading, Stack} from '@sanity/ui'
import React from 'react'
import {Product} from './Product'
import {User} from './User'

function LinkButton(props: {children?: React.ReactNode; href?: string} & ButtonProps) {
  const {href, ...restProps} = props
  const {handleClick} = useLink({href})

  return <Button {...restProps} as="a" href={href} onClick={handleClick} />
}

function StateButton(
  props: {children?: React.ReactNode; state?: RouterState; toIndex?: boolean} & ButtonProps
) {
  const {state, toIndex, ...restProps} = props
  const {handleClick, href} = useStateLink({state, toIndex})

  return <Button {...restProps} as="a" href={href} onClick={handleClick} />
}

export const Main = withRouter(function Main(props) {
  const {router} = props

  return (
    <Container width={1}>
      <Stack space={4}>
        <Heading as="h1" size={3}>
          Main
        </Heading>
        <Heading as="h2">Current router state (global):</Heading>
        <Card padding={2} shadow={1}>
          <Code size={1}>{JSON.stringify(router.state, null, 2)}</Code>
        </Card>

        {router.state.product && (
          <Card padding={2} shadow={1} tone="primary">
            <RouteScope scope="product">
              <Product id={router.state.product.id} />
            </RouteScope>
          </Card>
        )}

        {router.state.userId && <User id={router.state.userId} />}

        <Grid columns={2} gap={3}>
          <StateButton state={{product: {id: 55}}} text="Go to product #55" />
          <StateButton state={{userId: 'me'}} text="Show profile" />
          <StateButton
            state={{product: {id: 55, userId: 'me'}}}
            text="Show both product and profile"
          />
          <LinkButton
            href={`/foo/bar/${Math.random().toString(32).substring(2)}`}
            text="Invalid"
            tone="critical"
          />
          <StateButton text="Back to index" toIndex tone="primary" />
        </Grid>
      </Stack>
    </Container>
  )
})
