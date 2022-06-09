import { CommonQuestionPlainObject, Question, QuestionPlainObject } from './question'

export interface TerminationQuestionPlainObject extends CommonQuestionPlainObject {
  type: 'termination'
}

/**
 * 終端の回答
 */
export class TerminationQuestion extends Question {
  public constructor(public readonly file: string, object: unknown) {
    super(file, object)
  }

  public toPlainObject(): QuestionPlainObject {
    return {
      key: this.key,
      slug: this.slug,
      msg: this.msg,
      type: 'termination',
    }
  }

  public getSlugs(prevSlug: string[]): string[][] {
    const currentSlug = [...prevSlug, this.slug]
    return [currentSlug]
  }

  public isResolved(): boolean {
    return true
  }
}
