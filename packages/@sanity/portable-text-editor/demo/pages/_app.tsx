import {AppContainer} from '../components/containers'

export default function PortableTextEditorDemo({Component, pageProps}) {
  return (
    <AppContainer>
      <Component {...pageProps} />
    </AppContainer>
  )
}
