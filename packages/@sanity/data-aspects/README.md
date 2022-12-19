# ⚠️ THIS PACKAGE IS DEPRECATED

> This package is part of Sanity Studio v2, which has been superseded by **Sanity Studio v3**, the current major version released on Dec 7th, 2022. This package is no longer used/needed for Sanity Studio in its current version and will be retired on Dec 7th, 2023. The core packages for Sanity Studio v2 will only receive critical bug fixes until this date.
>
> Please head over to [the documentation for Sanity Studio v3](https://www.sanity.io/docs/sanity-studio) to learn more.

# @sanity/data-aspects

Sanity plugin which controls how your data is presented.

## HOWEVER

We'll re-design how control of data presentation is handed over to a sanity studio maintainer. Hang on for snake tornado.

## Usage

Ensure you have data-aspects as a plugin in you Sanity installation. Either:

The config file `config/@sanity/data-aspects.json` lets you control how your data is listed , e.g.:

```
{
  "typeOptions": {
    "article": {
      "displayName": "Article",
      "itemDisplayField": "name"
    },
    "siteConfig": {
      "displayName": "Site configuration",
      "itemDisplayField": "title"
    }
  }
}
```

Refer to https://github.com/sanity-io/desk-tool/blob/current/src/SchemaPaneResolver.js for an example on how the DataAspectsResolver can be used.

## License

MIT-licensed.
