import {type SeralizedSchemaDebug, type SerializedTypeDebug} from '../../threads/validateSchema'

// This implements the metafile format of ESBuild.
type Metafile = {
  inputs: Record<string, MetafileInput>
  outputs: Record<string, MetafileOutput>
}

type MetafileOutput = {
  imports: []
  exports: []
  inputs: Record<string, {bytesInOutput: number}>
  bytes: number
}

type MetafileInput = {
  bytes: number
  imports: []
  format: 'esm' | 'csj'
}

/** Converts the  */
export function generateMetafile(schema: SeralizedSchemaDebug): Metafile {
  const output: MetafileOutput = {
    imports: [],
    exports: [],
    inputs: {},
    bytes: 0,
  }

  // Generate a esbuild metafile
  const inputs: Record<string, MetafileInput> = {}

  function processType(path: string, entry: SerializedTypeDebug) {
    let childSize = 0

    if (entry.fields) {
      for (const [name, fieldEntry] of Object.entries(entry.fields)) {
        processType(`${path}/${name}`, fieldEntry)
        childSize += fieldEntry.size
      }
    }

    if (entry.of) {
      for (const [name, fieldEntry] of Object.entries(entry.of)) {
        processType(`${path}/${name}`, fieldEntry)
        childSize += fieldEntry.size
      }
    }

    const selfSize = entry.size - childSize

    inputs[path] = {
      bytes: selfSize,
      imports: [],
      format: 'esm',
    }

    output.inputs[path] = {
      bytesInOutput: selfSize,
    }

    output.bytes += selfSize
  }

  for (const [name, entry] of Object.entries(schema.types)) {
    const fakePath = `schema/${entry.extends}/${name}`
    processType(fakePath, entry)
  }

  for (const [name, entry] of Object.entries(schema.hoisted)) {
    const fakePath = `hoisted/${name}`
    processType(fakePath, entry)
  }

  return {outputs: {root: output}, inputs}
}
