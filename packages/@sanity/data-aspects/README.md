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

If you want the desk tool plugin too, repeat the above for the `@sanity/desk-tool` plugin as well.

Add the file `config/@sanity/data-aspects.json` to you project and put some stuff in there, e.g.:

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

If you're using the desk-tool, the content of the above config file will take effect. If you're not using the desk-tool, but rather something home-grown, refer to https://github.com/sanity-io/desk-tool/blob/master/src/schemaPaneResolver.js for an example on how the DataAspectsResolver is used.

## License

MIT-licensed.
