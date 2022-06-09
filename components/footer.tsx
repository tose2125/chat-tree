import Link from 'next/link'
import { useRouter } from 'next/router'
import { Center } from '@chakra-ui/react'

export default function Footer(): JSX.Element {
  const router = useRouter()

  return (
    <Center p={2} bg='gray.100'>
      {router.locale !== 'ja' ? (
        <Link href={router.pathname} locale='ja'>
          日本語
        </Link>
      ) : (
        <></>
      )}
      {router.locale !== 'en' ? (
        <Link href={router.pathname} locale='en'>
          English
        </Link>
      ) : (
        <></>
      )}
    </Center>
  )
}
