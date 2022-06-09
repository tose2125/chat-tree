import { dirname, join, sep } from 'path'
import { z } from 'zod'
import { CommonQuestionPlainObject, Question, QuestionPlainObject } from './question'

export interface InternalLinkQuestionPlainObject extends CommonQuestionPlainObject {
  type: 'internalLink'
  next: QuestionPlainObject
}

/**
 * Questions Tree 内へのリンク
 * （次のノードへ自動遷移する）
 */
export class InternalLinkQuestion extends Question {
  public static readonly schema = super.schema.extend({
    next: z.string(),
  })

  /** リンク先 */
  public readonly next: InternalLinkQuestionSchema['next']

  private _resolvedNext: Question | undefined

  public constructor(public readonly file: string, object: unknown) {
    super(file, object)
    const parsedObject = InternalLinkQuestion.schema.parse(object)
    this.next = parsedObject.next
  }

  public toPlainObject(): QuestionPlainObject {
    return {
      key: this.key,
      slug: this.slug,
      msg: this.msg,
      type: 'internalLink',
      next: this.resolvedNext.toPlainObject(),
    }
  }

  public getSlugs(prevSlug: string[]): string[][] {
    return this.resolvedNext.getSlugs(prevSlug)
  }

  public isResolved(): boolean {
    return this._resolvedNext?.isResolved() ?? false
  }

  public resolve(next: Question): void {
    if (this._resolvedNext !== undefined) throw new Error('Already resolved!')
    // TODO: 対応関係のチェック
    this._resolvedNext = next
  }

  public get resolvedNext(): Question {
    if (this._resolvedNext === undefined) throw new Error('Not resolved!')
    return this._resolvedNext
  }

  /**
   * 参照先のファイル名・ファイル内キー
   */
  public get fileAndKey(): [string, string] {
    const lastSlash = this.next.lastIndexOf('/')
    if (lastSlash < 0) {
      // 同ファイル
      return [this.file, this.next]
    } else {
      // 別ファイル
      return [join(dirname(this.file), this.next.substring(0, lastSlash) + '.yaml').replace(sep, '/'), this.next.substring(lastSlash + 1)]
    }
  }
}

type InternalLinkQuestionSchema = z.infer<typeof InternalLinkQuestion.schema>
