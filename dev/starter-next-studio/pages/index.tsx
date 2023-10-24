import Link from 'next/link'

export default function IndexPage() {
  return (
    <Link href="/studio/desk">
      <a
        style={{
          display: 'block',
          textAlign: 'center',
          paddingTop: '40vh',
        }}
      >
        Launch Sanity Studio inside Next.js!
      </a>
    </Link>
  )
}
