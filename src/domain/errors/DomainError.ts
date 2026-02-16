/**
 * ドメイン層で発生するエラーの基底クラス
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DomainError'
    Object.setPrototypeOf(this, DomainError.prototype)
  }
}

/**
 * 不変条件違反エラー
 */
export class InvariantViolationError extends DomainError {
  constructor(message: string) {
    super(message)
    this.name = 'InvariantViolationError'
    Object.setPrototypeOf(this, InvariantViolationError.prototype)
  }
}

/**
 * 無効な引数エラー
 */
export class InvalidArgumentError extends DomainError {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidArgumentError'
    Object.setPrototypeOf(this, InvalidArgumentError.prototype)
  }
}
