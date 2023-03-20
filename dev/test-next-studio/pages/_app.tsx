/* eslint-disable react/react-in-jsx-scope */

import type {AppProps} from 'next/app'

// eslint-disable-next-line import/no-unassigned-import
import '../app/global.css'

export default function App({Component, pageProps}: AppProps) {
  return <Component {...pageProps} />
}
