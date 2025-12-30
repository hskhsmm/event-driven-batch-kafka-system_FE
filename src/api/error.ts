// src/api/error.ts

/**
 * API 요청에서 발생하는 에러를 위한 커스텀 에러 클래스입니다.
 * 백엔드에서 받은 errorCode와 HTTP 상태 코드를 포함합니다.
 */
export class ApiError extends Error {
  public errorCode?: string;
  public statusCode?: number;

  constructor(
    message: string,
    errorCode?: string,
    statusCode?: number
  ) {
    super(message);
    this.name = 'ApiError';
    this.errorCode = errorCode;
    this.statusCode = statusCode;
  }
}
