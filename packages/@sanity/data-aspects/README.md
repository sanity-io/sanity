# @sanity/data-aspects

Sanity plugin which controls how your data is presented.


## BIG FAT DISCLAIMER

This is alpha software. Nothing should be expected to work.

## TODO
[ ] When gql/gradient supports limit, offset and order, make sure DataAspectsResolver rolls the query cigar correctly.

## Usage

Ensure you have data-aspects as a plugin in you Sanity installation. Either:

The config file `config/@sanity/data-aspects.json` lets you control how your data is listed , e.g.:

```
{
  "hiddenTypes": [
    "secretTypeName"
  ],
  "typeOptions": {
    "article": {
      "displayName": "Article",
      "itemDisplayField": "name",
      "limit": 100,
      "offset": 0
    },
    "siteConfig": {
      "displayName": "Site configuration",
      "itemDisplayField": "title"
    }
  }
}
```

Refer to https://github.com/sanity-io/desk-tool/blob/master/src/SchemaPaneResolver.js for an example on how the DataAspectsResolver can be used.

## License

MIT-licensed.
