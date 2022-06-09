import { readFile } from 'fs/promises'
import yaml from 'js-yaml'
import { z } from 'zod'
import { Question } from './question'
import { ExternalLinkQuestion } from './question-external-link'
import { InternalLinkQuestion } from './question-internal-link'
import { OptionsQuestion } from './question-options'
import { TerminationQuestion } from './question-termination'

export const buildQuestionsTree = async (filePath: string): Promise<Question> => {
  const rootFileQuestions = await loadAndConvertFile(filePath)
  const rootQuestion = rootFileQuestions.find((question) => question.key === 'root')
  if (rootQuestion === undefined) throw new Error('The root question does not exist!')
  await resolveQuestion(
    {
      [filePath]: rootFileQuestions,
    },
    rootQuestion
  )
  return rootQuestion
}

const questionTypes = [ExternalLinkQuestion, InternalLinkQuestion, OptionsQuestion, TerminationQuestion] as const
const questionSchemaTypes = [ExternalLinkQuestion.schema, InternalLinkQuestion.schema, OptionsQuestion.schema, TerminationQuestion.schema] as const

const convertQuestion = (object: unknown, filePath: string): Question => {
  for (const questionType of questionTypes) {
    if (questionType.schema.safeParse(object).success) {
      return new questionType(filePath, object)
    }
  }
  throw new Error('Failed to convert to question object')
}

const loadAndConvertFile = async (filePath: string): Promise<ReadonlyArray<Question>> => {
  const fileString = await readFile(filePath, 'utf-8')
  const fileObject = yaml.load(fileString)
  const parsedObject = await z.array(z.union(questionSchemaTypes)).parseAsync(fileObject)
  return parsedObject.map((object) => convertQuestion(object, filePath))
}

const checkAndLoadFile = async (loadedFiles: LoadedFiles, filePath: string): Promise<LoadedFiles> => {
  if (Object.keys(loadedFiles).includes(filePath)) {
    // filePath が読み込み済みであれば、そのまま返す
    return loadedFiles
  } else {
    // filePath が読み込まれていなければ、読み込む
    return {
      ...loadedFiles,
      [filePath]: await loadAndConvertFile(filePath),
    }
  }
}

type LoadedFiles = Record<string, ReadonlyArray<Question>>
const resolveQuestion = async (loadedFiles: LoadedFiles, question: Question): Promise<LoadedFiles> => {
  if (!question.isResolved()) {
    if (question instanceof InternalLinkQuestion) {
      const [nextFile, nextKey] = question.fileAndKey
      loadedFiles = await checkAndLoadFile(loadedFiles, nextFile)
      const nextQuestion = loadedFiles[nextFile].find((question) => question.key === nextKey)
      if (nextQuestion === undefined) throw new Error('The target question does not exist!')
      question.resolve(nextQuestion)
      loadedFiles = await resolveQuestion(loadedFiles, nextQuestion)
    }
    if (question instanceof OptionsQuestion) {
      const nextQuestions: Question[] = []
      for (const index in question.opt) {
        nextQuestions[index] = convertQuestion(
          {
            ...question.opt[index],
            key: index,
          },
          question.file
        )
      }
      question.resolve(nextQuestions)
      for (const nextQuestion of question.resolvedOpt) {
        loadedFiles = await resolveQuestion(loadedFiles, nextQuestion)
      }
    }
  }
  if (!question.isResolved()) {
    throw new Error('Cannot resolve!')
  }
  return loadedFiles
}
