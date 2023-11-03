import type {AppProps} from 'next/app'

// eslint-disable-next-line import/no-unassigned-import
import '../reset.css'

export default function App({Component, pageProps}: AppProps) {
  return <Component {...pageProps} />
}
