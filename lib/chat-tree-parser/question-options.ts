import { z } from 'zod'
import { CommonQuestionPlainObject, Question, QuestionPlainObject } from './question'
import { ExternalLinkQuestion } from './question-external-link'
import { InternalLinkQuestion } from './question-internal-link'
import { TerminationQuestion } from './question-termination'

export interface OptionsQuestionPlainObject extends CommonQuestionPlainObject {
  type: 'options'
  opt: readonly QuestionPlainObject[]
}

/**
 * 選択式の回答
 */
export class OptionsQuestion extends Question {
  public static readonly schema = super.schema.extend({
    opt: z.array(
      z.union([
        ExternalLinkQuestion.schema.omit({ key: true }),
        InternalLinkQuestion.schema.omit({ key: true }),
        TerminationQuestion.schema.omit({ key: true }),
      ])
    ),
  })

  /** 選択肢 */
  public readonly opt: OptionsQuestionSchema['opt']

  private _resolvedOpt: ReadonlyArray<Question> | undefined

  public constructor(public readonly file: string, object: unknown) {
    super(file, object)
    const parsedObject = OptionsQuestion.schema.parse(object)
    this.opt = parsedObject.opt
  }

  public toPlainObject(): QuestionPlainObject {
    return {
      key: this.key,
      slug: this.slug,
      msg: this.msg,
      type: 'options',
      opt: this.resolvedOpt.map((opt) => opt.toPlainObject()),
    }
  }

  public getSlugs(prevSlug: string[]): string[][] {
    const currentSlug = [...prevSlug, this.slug]
    return [currentSlug, ...this.resolvedOpt.flatMap((opt) => opt.getSlugs(currentSlug))]
  }

  public isResolved(): boolean {
    return this._resolvedOpt?.every((question) => question.isResolved()) ?? false
  }

  public resolve(opt: ReadonlyArray<Question>): void {
    if (this._resolvedOpt !== undefined) throw new Error('Already resolved!')
    // TODO: 対応関係のチェック
    this._resolvedOpt = opt
  }

  public get resolvedOpt(): ReadonlyArray<Question> {
    if (this._resolvedOpt === undefined) throw new Error('Not resolved!')
    return this._resolvedOpt
  }
}

type OptionsQuestionSchema = z.infer<typeof OptionsQuestion.schema>
