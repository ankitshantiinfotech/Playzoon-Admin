import axios from 'axios';
import { toast } from 'sonner';

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
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
