# @sanity/import-cli

CLI tool that imports documents from an ndjson file or URL

## Installation

```
npm install -g @sanity/import-cli
```

## Usage

```
  CLI tool that imports documents from an ndjson file or URL

  Usage
    $ sanity-import -p <projectId> -d <dataset> -t <token> sourceFile.ndjson

  Options
    -p, --project <projectId> Project ID to import to
    -d, --dataset <dataset> Dataset to import to
    -t, --token <token> Token to authenticate with
    --asset-concurrency <concurrency> Number of parallel asset imports
    --replace Replace documents with the same IDs
    --missing Skip documents that already exist
    --allow-failing-assets Skip assets that cannot be fetched/uploaded
    --replace-assets Skip reuse of existing assets
    --skip-cross-dataset-references Skips references to other datasets
    --help Show this help

  Examples
    # Import "./my-dataset.ndjson" into dataset "staging"
    $ sanity-import -p myPrOj -d staging -t someSecretToken my-dataset.ndjson

    # Import into dataset "test" from stdin, read token from env var
    $ cat my-dataset.ndjson | sanity-import -p myPrOj -d test -

  Environment variables (fallbacks for missing flags)
    --token = SANITY_IMPORT_TOKEN
```

## License

MIT-licensed. See LICENSE.
