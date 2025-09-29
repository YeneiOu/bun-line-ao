export function success(code: number = 0, message: string = "success", data: any) {
    return {
      code,
      message,
      data
    }
  }
  
  export function error(code = 1, message: string = "error", data: any = null) {
    return {
      code,
      message,
      data
    }
  }
  