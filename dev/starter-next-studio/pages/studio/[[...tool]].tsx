import {useRouter} from 'next/router'
import {useState} from 'react'
import Studio from '../../components/Studio'

export default function StudioPage() {
  const router = useRouter()
  const [basePath] = useState(() => router.route.split('/[[...tool]]')?.[0])

  return <Studio basePath={basePath} />
}
