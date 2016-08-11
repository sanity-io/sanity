# @sanity/data-aspects

Sanity plugin which controls how your data will be presented.


## BIG FAT DISCLAIMER

This is alpha software. Nothing should be expected to work.

## TODO
- In sanity/form-builder, ensure that the implemented role `role:@sanity/base/core-types` also exposes sanity types image, imageAsset, imageVersion, geopoint.
- When gql/gradient supports limit, offset and order, make sure DataAspectsResolver rolls the query cigar correctly.

## Usage

Ensure you have data-aspects as a plugin in you Sanity installation. Either:

The config file `config/@sanity/data-aspects.json` lets you control how your data is listed , e.g.:

```
{
  "hiddenTypes": [
    "image",
    "imageAsset",
    "imageVersion"
  ],
  "listOptions": {
    "beer": {
      "limit": 100,
      "offset": 0,
      "displayField": "name"
    },
    "brewery": {
      "displayField": "name"
    }
  }
}
```

Refer to https://github.com/sanity-io/desk-tool/blob/master/src/schemaPaneResolver.js for an example on how the DataAspectsResolver can be used.

## License

MIT-licensed.
