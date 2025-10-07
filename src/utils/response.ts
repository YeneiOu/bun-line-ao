type ApiResponse<T = any> = {
  code: number;
  message: MessageResponse;
  data: T;
};
type MessageResponse = {
  code: number;
  message: string;
};

export function ResponseSuccess<T>(
  code = 0,
  message: MessageResponse,
  data: T
): ApiResponse<T> {
  return {
    code,
    message,
    data,
  };
}

export function ResponseError<T = null>(
  code = 1,
  message: MessageResponse,
  data: T
): ApiResponse<T> {
  return {
    code,
    message,
    data,
  };
}
