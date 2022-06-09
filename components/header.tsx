import Head from 'next/head'
import { Box, Heading } from '@chakra-ui/react'

export default function Header(): JSX.Element {
  return (
    <Box p={2} bg='teal.100'>
      <Head>
        <title>チャットツリー</title>
      </Head>
      <Heading as='h1'>チャットツリー</Heading>
    </Box>
  )
}
