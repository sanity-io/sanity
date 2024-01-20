// eslint-disable-next-line import/no-unassigned-import
import '../app/global.css'

import {type AppProps} from 'next/app'

export default function App({Component, pageProps}: AppProps) {
  return <Component {...pageProps} />
}
