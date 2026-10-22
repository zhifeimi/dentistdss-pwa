// Dictionary of HTTP error status codes and user-friendly messages
const httpErrorMessages: Record<number, string> = {
  400: 'Bad Request. Please check your input and try again.',
  401: 'Unauthorized. Please log in to continue.',
  403: 'Forbidden. You do not have permission to perform this action.',
  404: 'Not Found. The requested resource could not be found.',
  405: 'Method Not Allowed. Please contact support.',
  408: 'Request Timeout. Please try again later.',
  409: 'Conflict. The request could not be completed due to a conflict.',
  413: 'Payload Too Large. Please upload a smaller file.',
  415: 'Unsupported Media Type. Please check your file format.',
  422: 'Unprocessable Entity. Please check your input.',
  429: 'Too Many Requests. Please slow down and try again.',
  500: 'Internal Server Error. Please try again later.',
  502: 'Bad Gateway. Please try again later.',
  503: 'Service Unavailable. Please try again later.',
  504: 'Gateway Timeout. Please try again later.',
};

export function getHttpErrorMessage(status: number): string {
  return httpErrorMessages[status] || 'An unexpected error occurred. Please try again.';
} 