import { FC, VFC } from 'react'
import { join } from 'path'
import { ParsedUrlQuery } from 'querystring'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { GetStaticPaths, GetStaticProps } from 'next/types'
import { Button, ButtonProps, Center, Grid, GridItem, Heading, SlideFade, Spinner, Stack, Text, VStack } from '@chakra-ui/react'
import Layout from '../components/layout'
import { buildQuestionsTree } from '../lib/chat-tree-parser/build-questions-tree'
import { QuestionPlainObject } from '../lib/chat-tree-parser/question'
import { InternalLinkQuestionPlainObject } from '../lib/chat-tree-parser/question-internal-link'

const MessageComponent: VFC<{ msg: Record<string, string> }> = ({ msg }) => {
  const router = useRouter()
  const locale = router.locale
  if (locale !== undefined && locale in msg) {
    return <>{msg[locale]}</>
  }
  const defaultLocale = router.defaultLocale
  if (defaultLocale !== undefined && defaultLocale in msg) {
    return <>{msg[defaultLocale]}</>
  }
  throw new Error('Locale data is not included.')
}

const ExternalLinkComponent: FC<{ href: string } & ButtonProps> = ({ href, children, ...props }) => (
  <Button as='a' {...props} href={href} target='_blank' rel='noopener noreferrer'>
    {children ?? href}
  </Button>
)

const InternalLinkComponent: FC<{ slug: string[] } & ButtonProps> = ({ slug, children, ...props }) => (
  <Link href={'/' + slug.join('/')} passHref scroll={false}>
    <Button as='a' {...props}>
      {children ?? slug.join('/')}
    </Button>
  </Link>
)

const OptionComponent: VFC<{ question: QuestionPlainObject; currentSlug: string[] } & ButtonProps> = ({ question, currentSlug, ...props }) => (
  <>
    {question.type === 'externalLink' ? (
      <ExternalLinkComponent {...props} href={question.link}>
        <MessageComponent msg={question.msg} />
      </ExternalLinkComponent>
    ) : (
      <></>
    )}
    {question.type === 'internalLink' ? (
      <InternalLinkComponent {...props} slug={[...currentSlug, question.next.slug]}>
        <MessageComponent msg={question.msg} />
      </InternalLinkComponent>
    ) : (
      <></>
    )}
    {question.type === 'termination' ? (
      <InternalLinkComponent {...props} slug={[]}>
        <MessageComponent msg={question.msg} />
      </InternalLinkComponent>
    ) : (
      <></>
    )}
  </>
)

const QuestionComponent: VFC<{ question: QuestionPlainObject; currentSlug: string[]; targetSlug: string[] }> = ({ question, currentSlug, targetSlug }) => {
  const nextOptionSlug = targetSlug.length > 0 ? targetSlug[0] : undefined
  const nextOptionObject =
    question.type === 'options'
      ? question.opt
          .filter((child): child is InternalLinkQuestionPlainObject => child.type === 'internalLink')
          .find((child) => child.next.slug === nextOptionSlug)
      : undefined

  return (
    <>
      <Grid as={SlideFade} in={true} w='100%' pt={2} pb={2} rounded='lg' bg='blue.50' templateRows='1fr' templateColumns='3rem 1fr'>
        <GridItem>
          {question.type === 'options' ? (
            <Text fontSize='2xl' fontWeight='bold' textAlign='center'>
              Q
            </Text>
          ) : (
            <></>
          )}
        </GridItem>
        <GridItem>
          <Heading as='h2' pt={2} pb={2} fontSize='normal' fontWeight='normal'>
            <MessageComponent msg={question.msg} />
          </Heading>
        </GridItem>
        <GridItem>
          {question.type === 'options' ? (
            <Text fontSize='2xl' fontWeight='bold' textAlign='center'>
              A
            </Text>
          ) : (
            <></>
          )}
        </GridItem>
        <GridItem>
          {question.type === 'externalLink' ? <ExternalLinkComponent href={question.link} /> : <></>}
          {question.type === 'options' ? (
            <Stack alignItems='center'>
              {question.opt.map((child) => (
                <OptionComponent
                  key={child.key}
                  question={child}
                  currentSlug={currentSlug}
                  colorScheme={child.type === 'internalLink' && child.next.slug === nextOptionSlug ? 'blue' : 'gray'}
                />
              ))}
            </Stack>
          ) : (
            <></>
          )}
          {question.type === 'termination' ? (
            <Stack alignItems='center'>
              <InternalLinkComponent slug={[]} colorScheme='gray'>
                Restart
              </InternalLinkComponent>
            </Stack>
          ) : (
            <></>
          )}
        </GridItem>
      </Grid>
      {question.type === 'internalLink' ? <QuestionComponent question={question.next} currentSlug={currentSlug} targetSlug={targetSlug} /> : <></>}
      {nextOptionSlug !== undefined && nextOptionObject !== undefined ? (
        <QuestionComponent question={nextOptionObject.next} currentSlug={[...currentSlug, nextOptionSlug]} targetSlug={targetSlug.slice(1)} />
      ) : (
        <></>
      )}
    </>
  )
}

interface Props {
  data: QuestionPlainObject
}

interface Params extends ParsedUrlQuery {
  slug: string[]
}

const TreePage: VFC<Props> = (props) => {
  const router = useRouter()
  const rawSlug = router.query.slug ?? ''
  const slug = typeof rawSlug === 'string' ? rawSlug.split('/') : rawSlug

  return (
    <Layout>
      {props.data === undefined || props.data === null ? (
        <Center>
          <Spinner />
        </Center>
      ) : (
        <VStack mt={2} mb={2}>
          <QuestionComponent question={props.data} currentSlug={[]} targetSlug={slug} />
        </VStack>
      )}
    </Layout>
  )
}

export default TreePage

export const getStaticProps: GetStaticProps<Props, Params> = async () => {
  const data = (await buildQuestionsTree(join(process.cwd(), './contents/main.yaml'))).toPlainObject()

  return {
    props: {
      data,
    },
  }
}

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  const slugs = (await buildQuestionsTree(join(process.cwd(), './contents/main.yaml'))).getSlugs([])

  return {
    paths: slugs.flatMap((slug) => [
      { params: { slug: slug.slice(1) }, locale: 'ja' },
      { params: { slug: slug.slice(1) }, locale: 'en' },
    ]),
    fallback: false,
  }
}
