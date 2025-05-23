
// src/utils/error-handler.ts
import { toast } from 'sonner';

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = {
  handle(error: unknown, showToast = true): AppError {
    let appError: AppError;
    
    if (error instanceof AppError) {
      appError = error;
    } else if (error instanceof Error) {
      appError = new AppError(error.message);
    } else if (typeof error === 'string') {
      appError = new AppError(error);
    } else {
      appError = new AppError('An unexpected error occurred');
    }
    
    // Log error for debugging
    console.error('[Error]', {
      message: appError.message,
      code: appError.code,
      details: appError.details,
      stack: appError.stack
    });
    
    // Show user-friendly error message
    if (showToast) {
      toast.error(this.getUserMessage(appError));
    }
    
    return appError;
  },
  
  getUserMessage(error: AppError): string {
    // Map technical errors to user-friendly messages
    const errorMessages: Record<string, string> = {
      'NETWORK_ERROR': 'Unable to connect to the server. Please check your internet connection.',
      'AUTH_FAILED': 'Authentication failed. Please log in again.',
      'PERMISSION_DENIED': 'You don\'t have permission to perform this action.',
      'NOT_FOUND': 'The requested resource was not found.',
      'VALIDATION_ERROR': 'Please check your input and try again.',
      'SERVER_ERROR': 'A server error occurred. Please try again later.'
    };
    
    return errorMessages[error.code || ''] || error.message;
  }
};