# sanity-vision
Vision is a plugin for Sanity Studio for testing GROQ queries. It features: 

* GROQ syntax highlighting so that the query is easier to read. 
* Parsed response that's more convenient to navigate and explore.
* Switch between datasets
* Listening for real-time updates

![screenshot](https://cdn.sanity.io/images/3do82whm/next/da4cb4ff12945f0a95e6695ee2fad0470e14da9e-1651x1017.png)

## Installation
`sanity install @sanity/vision`

### Configuring

It is possible to override the default configuration by setting up a config file.

Create a file named `vision.json` and place it at `config/@sanity/vision.json` relative to your root studio folder.

Currently we only support overriding the default API version.

Here's an example `vision.json` file:

```js
{
  "defaultApiVersion": "v2021-10-21"
}
```

- `defaultApiVersion` Valid options is `v1`, `vX`, `v2021-03-25` or `v2021-10-21`
