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
