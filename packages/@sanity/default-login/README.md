# @sanity/default-login

Let a user log into Sanity, and get access to the child content.

```
<LoginWrapper>
  {user => <Layout><div>{user.name} is logged in!</div></Layout>}
</LoginWrapper>

```

## Props

```
static propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.func
  ]).isRequired,
  title: PropTypes.string,
  description: PropTypes.string,
  sanityLogo: PropTypes.node
}
```

```
static defaultProps = {
  title: 'Choose login provider',
  description: null,
  sanityLogo: <SanityStudioLogo />,
}
```
