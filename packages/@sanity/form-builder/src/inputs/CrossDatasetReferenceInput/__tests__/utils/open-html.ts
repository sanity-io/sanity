import fs from 'fs'
import os from 'os'
import crypto from 'crypto'
import path from 'path'
import open from 'open'

export function openHtml(html: string) {
  const tempfile = `${path.join(os.tmpdir(), crypto.randomBytes(20).toString('hex'))}.html`
  fs.writeFileSync(tempfile, html)
  open(tempfile, {
    newInstance: true,
    app: {name: open.apps.chrome, arguments: ['--auto-open-devtools-for-tabs']},
  })
}

export function openElement(element: Element) {
  openHtml(element.outerHTML)
}
