# ⚠️ THIS PACKAGE IS DEPRECATED

> This package is part of Sanity Studio v2, which has been superseded by **Sanity Studio v3**, the current major version released on Dec 7th, 2022. This package is no longer used/needed for Sanity Studio in its current version and will be retired on Dec 7th, 2023. The core packages for Sanity Studio v2 will only receive critical bug fixes until this date.
>
> Please head over to [the documentation for Sanity Studio v3](https://www.sanity.io/docs/sanity-studio) to learn more.

# @sanity/default-login

Let a user log into Sanity, and get access to the child content.

## Configuration

By default this component will ask the Sanity API and get a list of providers, which the user can login with.

However it is possible for enterprise customers to supply their own third party authentication server as a provider as well.

This is done through configuring the studio with the file `./config/@sanity/default-login.json`

Example:

```
{
  "providers": {
    // Append the custom providers to the default providers or replace them.
    "mode": "append", // default - or 'replace'

    // If true, don't show the choose provider logo screen,
    // automatically redirect to the single provider login
    "redirectOnSingle": false // default

    // The custom provider implementations
    "entries": [
      {
        "name": "vandelay",
        "title": "Vandelay Industries",
        "url": "https://api.vandelay.industries/login",
        "logo": "/static/img/vandelay.svg" // Optional, put it in the studio static folder
      }
    ]
  },

  // Login method to use for the studio the studio. Can be one of:
  // `dual` (default) - attempt to use cookies where possible, falling back to storing authentication token in `localStorage` otherwise
  // `cookie` - explicitly disable `localStorage` method, relying only on cookies
  "loginMethod": "dual"
}
```

## Using the component

```
<LoginWrapper>
  {user => <Layout><div>{user.name} is logged in!</div></Layout>}
</LoginWrapper>

```

### Props

```
static propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.func
  ]).isRequired,
  title: PropTypes.string,
  description: PropTypes.string,
  SanityLogo: PropTypes.func
}
```

```
static defaultProps = {
  title: 'Choose login provider',
  description: null,
  SanityLogo: SanityStudioLogo,
}
```
