import fs from 'fs/promises'
import path from 'path'
import {createClient} from '@sanity/client'
import {groupBy} from 'lodash'
import {combineLatest, map} from 'rxjs'
import {sanityIdify} from './utils/sanityIdify'
import {readEnv} from 'sanity-perf-tests/config/envVars'

const QUERY = `*[_type=='exportSymbol'] {
  _id,
  "package": exportedBy->normalized,
  "isDocumented": defined(versions[0].comment)
}
`

interface ExportSymbol {
  _id: string
  package: string
  isDocumented: boolean
}

interface Report {
  package: string
  documented: number
}

const studioMetricsClient = createClient({
  projectId: 'c1zuxvqn',
  dataset: sanityIdify(readEnv('DOCS_REPORT_DATASET')),
  token: readEnv('DOCS_REPORT_TOKEN'),
  apiVersion: '2023-02-03',
  useCdn: false,
})

const studioMetricsClientProduction = createClient({
  projectId: 'c1zuxvqn',
  dataset: 'production',
  token: readEnv('DOCS_REPORT_TOKEN'),
  apiVersion: '2023-02-03',
  useCdn: false,
})

function getDocumentationReport(symbols: ExportSymbol[]): Report[] {
  const obj = groupBy(symbols, 'package')

  return Object.entries(obj).map(([key, val]) => {
    // return total number of documented and not documented symbols
    return {
      package: key,
      documented: val.filter((s) => s.isDocumented).length,
    }
  })
}

combineLatest([
  studioMetricsClient.observable.fetch(QUERY),
  studioMetricsClientProduction.observable.fetch(QUERY),
])
  .pipe(
    map(
      ([branch, production]: [ExportSymbol[], ExportSymbol[]]): {
        package: string
        documentedChange: number
      }[] => {
        const branchGroup = getDocumentationReport(branch)
        const productionGroup = getDocumentationReport(production)

        // Compare the two groups and return percent difference
        return branchGroup.map((br) => {
          const prod = productionGroup.find((p) => p.package === br.package)

          if (!prod) {
            return {
              package: br.package,
              documentedChange: 0,
            }
          }

          const documentedPercentDiff = (br.documented - prod.documented) / prod.documented

          return {
            package: br.package,
            documentedChange: Number.isNaN(documentedPercentDiff)
              ? 0
              : Math.floor(documentedPercentDiff * 100),
          }
        })
      },
    ),
  )
  .subscribe(async (res) => {
    // convert the result to a markdown table with heading
    const table = `
| Package | Documentation Change |
| ------- | ----------------- |
${res
  .sort((a, b) => b.documentedChange - a.documentedChange)
  .map((r) => `| ${r.package} | ${r.documentedChange}% |`)
  .join('\n')}
`

    // save it to a file
    await fs.writeFile(path.resolve(__dirname, 'docs-report.md'), table, 'utf8')
  })
