import { z } from 'zod'
import { CommonQuestionPlainObject, Question, QuestionPlainObject } from './question'

export interface ExternalLinkQuestionPlainObject extends CommonQuestionPlainObject {
  type: 'externalLink'
  link: string
}

/**
 * Questions Tree 外へのリンク
 */
export class ExternalLinkQuestion extends Question {
  public static readonly schema = super.schema.extend({
    link: z.string(),
  })

  /** リンク先 */
  public readonly link: ExternalLinkQuestionSchema['link']

  public constructor(public readonly file: string, object: unknown) {
    super(file, object)
    const parsedObject = ExternalLinkQuestion.schema.parse(object)
    this.link = parsedObject.link
  }

  public toPlainObject(): QuestionPlainObject {
    return {
      key: this.key,
      slug: this.slug,
      msg: this.msg,
      type: 'externalLink',
      link: this.link,
    }
  }

  public getSlugs(): string[][] {
    return [] // ExternalLink はページを作らない
  }

  public isResolved(): boolean {
    return true
  }
}

type ExternalLinkQuestionSchema = z.infer<typeof ExternalLinkQuestion.schema>
