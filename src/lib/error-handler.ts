import axios from 'axios';
import { toast } from 'sonner';

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

interface ValidationDetail {
  field: string;
  message: string;
  type?: string;
}

interface BackendEnvelope {
  success?: boolean;
  data?: unknown;
  error?: {
    code?: string;
    details?: ValidationDetail[];
  };
  message?: string;
  errors?: Record<string, string[]>;
}

export interface FieldErrorsMap {
  [fieldName: string]: string;
}

export interface ApiErrorWithDetailsResult {
  message: string;
  fieldErrors?: FieldErrorsMap;
  code?: string;
}

/** Structured validation errors for forms (matches Playzoon API envelope). */
export function handleApiErrorWithDetails(error: unknown): ApiErrorWithDetailsResult {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const envelope = error.response?.data as BackendEnvelope | undefined;
    const message = envelope?.message || error.message;

    if (status === 422) {
      const details = envelope?.error?.details;
      if (details && details.length > 0) {
        const fieldErrors: FieldErrorsMap = {};
        const messages: string[] = [];
        details.forEach((d) => {
          fieldErrors[d.field] = d.message;
          messages.push(d.message);
        });
        const toastMsg =
          messages.length <= 3
            ? messages.join('. ')
            : `${messages.slice(0, 3).join('. ')} (+${messages.length - 3} more)`;
        toast.error('Validation error', { description: toastMsg });
        return { message: messages[0], fieldErrors, code: envelope?.error?.code };
      }

      if (envelope?.errors) {
        const fieldErrors: FieldErrorsMap = {};
        const messages: string[] = [];
        Object.entries(envelope.errors).forEach(([field, msgs]) => {
          if (msgs && msgs.length > 0) {
            fieldErrors[field] = msgs[0];
            messages.push(msgs[0]);
          }
        });
        if (messages.length > 0) {
          toast.error('Validation error', { description: messages.join('. ') });
          return { message: messages[0], fieldErrors };
        }
      }

      toast.error('Validation error', { description: message });
      return { message };
    }

    const msg = handleApiError(error);
    return { message: msg, code: envelope?.error?.code };
  }

  if (error instanceof Error) {
    toast.error('Error', { description: error.message });
    return { message: error.message };
  }

  toast.error('An unexpected error occurred');
  return { message: 'Unknown error' };
}

export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as ApiErrorResponse | undefined;
    const message = data?.message || error.message;

    switch (status) {
      case 400:
        toast.error('Bad Request', { description: message });
        return message;
      case 401:
        toast.error('Session Expired', { description: 'Please log in again.' });
        return 'Session expired';
      case 403:
        toast.error('Access Denied', { description: 'Insufficient permissions.' });
        return 'Access denied';
      case 404:
        toast.error('Not Found', { description: message });
        return message;
      case 422: {
        const firstError = data?.errors
          ? Object.values(data.errors).flat()[0]
          : message;
        toast.error('Validation Error', { description: firstError });
        return firstError || message;
      }
      case 429:
        toast.error('Too Many Requests', { description: 'Please wait and try again.' });
        return 'Rate limited';
      default:
        if (status && status >= 500) {
          toast.error('Server Error', { description: 'Please try again later.' });
          return 'Server error';
        }
        toast.error('Error', { description: message });
        return message;
    }
  }

  if (error instanceof Error) {
    if (error.message === 'Network Error') {
      toast.error('Network Error', { description: 'Check your connection.' });
      return 'Network error';
    }
    toast.error('Error', { description: error.message });
    return error.message;
  }

  toast.error('An unexpected error occurred');
  return 'Unknown error';
}
