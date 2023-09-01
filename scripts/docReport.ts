import fs from 'fs/promises'
import path from 'path'
import {createClient} from '@sanity/client'
import {groupBy} from 'lodash'
import {combineLatest, map} from 'rxjs'
import ora from 'ora'
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
  notDocumented: number
}

interface TransformResult {
  package: string
  documentedChange: number
  prodDocumented: number
  prodNotDocumented: number
  branchDocumented: number
  branchNotDocumented: number
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
      notDocumented: val.filter((s) => !s.isDocumented).length,
    }
  })
}

const timer = startTimer(`Fetching docs report`)

combineLatest([
  studioMetricsClient.observable.fetch(QUERY),
  studioMetricsClientProduction.observable.fetch(QUERY),
])
  .pipe(
    map(([branch, production]: [ExportSymbol[], ExportSymbol[]]): TransformResult[] => {
      const branchGroup = getDocumentationReport(branch)
      const productionGroup = getDocumentationReport(production)

      // Compare the two groups and return percent difference
      return branchGroup.map((br) => {
        const prod = productionGroup.find((p) => p.package === br.package)

        if (!prod) {
          return {
            package: br.package,
            documentedChange: 0,
            prodDocumented: 0,
            prodNotDocumented: 0,
            branchDocumented: br.documented,
            branchNotDocumented: br.notDocumented,
          }
        }

        const documentedPercentDiff = (br.documented - prod.documented) / prod.documented

        return {
          package: br.package,
          documentedChange: Number.isNaN(documentedPercentDiff)
            ? 0
            : Math.floor(documentedPercentDiff * 100),
          prodDocumented: prod.documented,
          prodNotDocumented: prod.notDocumented,
          branchDocumented: br.documented,
          branchNotDocumented: br.notDocumented,
        }
      })
    }),
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

<details>
  <summary>Full Report</summary>
  ${res
    .sort((a, b) => b.documentedChange - a.documentedChange)
    .map(
      (r) =>
        `<details>
  <summary>${r.package}</summary>
  <table>
    <tr>
      <th>Branch</th>
      <th>Production</th>
    </tr>
    <tr>
      <td>${r.branchDocumented} documented</td>
      <td>${r.prodDocumented} documented</td>
    </tr>
    <tr>
      <td>${r.branchNotDocumented} not documented</td>
      <td>${r.prodNotDocumented} not documented</td>
    </tr>
  </table>
</details>
`,
    )
    .join('\n')}
</details>
`

    // save it to a file
    await fs.writeFile(path.resolve(__dirname, 'docs-report.md'), table, 'utf8')

    timer.end()
  })

function startTimer(label: string) {
  const spinner = ora(label).start()
  const start = Date.now()
  return {
    end: () => spinner.succeed(`${label} (${formatMs(Date.now() - start)})`),
  }
}

function formatMs(ms: number) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`
}
