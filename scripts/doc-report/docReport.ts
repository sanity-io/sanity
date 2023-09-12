import fs from 'fs/promises'
import path from 'path'
import {groupBy} from 'lodash'
import {combineLatest, map} from 'rxjs'
import {startTimer} from '../utils/startTimer'
import {createDocClient} from './docClient'
import {readEnv} from './envVars'

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

const studioMetricsClient = createDocClient(readEnv('DOCS_REPORT_DATASET'))
const studioMetricsClientProduction = createDocClient('next')

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
            : Math.ceil(documentedPercentDiff * 100),
          prodDocumented: prod.documented,
          prodNotDocumented: prod.notDocumented,
          branchDocumented: br.documented,
          branchNotDocumented: br.notDocumented,
        }
      })
    }),
  )
  .subscribe(async (res) => {
    const result = res.filter((r) => r.documentedChange !== 0)

    let report = ''

    if (result.length === 0) {
      report = 'No changes to documentation'
    } else {
      // convert the result to a markdown table with heading
      report = `
      | Package | Documentation Change |
      | ------- | ----------------- |
      ${res
        .sort((a, b) => b.documentedChange - a.documentedChange)
        .filter((r) => r.documentedChange !== 0)
        .map(
          (r) =>
            `| ${r.package} | ${
              r.documentedChange > 0 ? `+${r.documentedChange}` : r.documentedChange
            }% |`,
        )
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
            <th>This branch</th>
            <th>Next branch</th>
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
    }

    // save it to a file
    await fs.writeFile(path.resolve(path.join(__dirname, '..', 'docs-report.md')), report, 'utf8')

    timer.end()
  })
