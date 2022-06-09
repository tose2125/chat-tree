import { PropsWithChildren } from 'react'
import { Container } from '@chakra-ui/react'
import Footer from './footer'
import Header from './header'

export default function Layout(props: PropsWithChildren<unknown>): JSX.Element {
  return (
    <>
      <header>
        <Header />
      </header>
      <main>
        <Container maxW='xl'>{props.children}</Container>
      </main>
      <footer>
        <Footer />
      </footer>
    </>
  )
}
