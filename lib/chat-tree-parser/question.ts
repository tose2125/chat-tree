import { sep } from 'path'
import { z } from 'zod'
import { ExternalLinkQuestionPlainObject } from './question-external-link'
import { InternalLinkQuestionPlainObject } from './question-internal-link'
import { OptionsQuestionPlainObject } from './question-options'
import { TerminationQuestionPlainObject } from './question-termination'

export interface CommonQuestionPlainObject {
  key: string
  slug: string
  msg: {
    ja: string
    en: string
  }
}

export type QuestionPlainObject =
  | ExternalLinkQuestionPlainObject
  | InternalLinkQuestionPlainObject
  | OptionsQuestionPlainObject
  | TerminationQuestionPlainObject

/**
 * Questions Tree の基底ノード
 */
export abstract class Question {
  public static readonly schema = z.object({
    key: z.string(),
    msg: z.object({
      ja: z.string(),
      en: z.string(),
    }),
  })

  /** ファイル内でユニークなキー */
  public readonly key: QuestionSchema['key']
  /** 質問文 */
  public readonly msg: QuestionSchema['msg']

  /**
   * @param file ファイルパス
   * @param object YAML をパースしたオブジェクト
   */
  protected constructor(public readonly file: string, object: unknown) {
    const parsedObject = Question.schema.parse(object)
    // Object.assign(this, parsedObject)
    // MEMO: TypeScript の賢さに限界があるので今は列挙する
    this.key = parsedObject.key
    this.msg = parsedObject.msg
  }

  /**
   * Next.js の getStaticProps で返すデータは何かのクラスではダメらしい。
   */
  public abstract toPlainObject(): QuestionPlainObject

  /**
   * 子ノードの slug を集める
   */
  public abstract getSlugs(prevSlug: string[]): string[][]

  /**
   * 全ての子ノードが読み込まれているか
   */
  public abstract isResolved(): boolean

  public get slug(): string {
    return [this.file.split(sep).pop()?.replace('.yaml', ''), this.key.replace('root', '')].filter((str) => str).join('-')
  }
}

type QuestionSchema = z.infer<typeof Question.schema>
