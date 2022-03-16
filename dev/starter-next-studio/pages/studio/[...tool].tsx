/* eslint-disable react/react-in-jsx-scope */
import dynamic from 'next/dynamic'
import {useRouter} from 'next/router'

const Studio = dynamic(() => import('../../components/Studio'), {ssr: false})

export default function StudioPage() {
  const router = useRouter()
  const [basePath] = router.route.split('/[...tool]')
  return <Studio basePath={basePath} />
}
