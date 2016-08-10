# @sanity/data-aspects

Sanity plugin which controls how your data will be presented.


## BIG FAT DISCLAIMER

This is alpha software, nothing can be expected to work.

## TODO
- In sanity/form-builder, ensure that the implemented role `role:@sanity/base/core-types` also exposes sanity types image, imageAsset, imageVersion, geopoint.
- When gql/gradient supports limit, offset and order, make sure DataAspectsResolver rolls the query cigar correctly.

## Usage

Ensure you have data-aspects as a plugin in you Sanity installation. Either:
```
npm i -S @sanity/data-aspects
```
or
```
sanity install @sanity/data-aspects
```

Make sure data-aspects and desk-tool

Add the file `config/@sanity/data-aspects.json` and put some stuff in there, e.g.:

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
Have a look at https://github.com/sanity-io/desk-tool/blob/master/src/schemaPaneResolver.js for an example.

## License

MIT-licensed.
