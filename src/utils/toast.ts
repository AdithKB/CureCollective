// This is a simple wrapper to avoid TypeScript errors with react-hot-toast
// @ts-ignore
import { toast as hotToast } from 'react-hot-toast';

export const toast = {
  success: (message: string) => hotToast.success(message),
  error: (message: string) => hotToast.error(message),
  loading: (message: string) => hotToast.loading(message),
  dismiss: (toastId?: string) => hotToast.dismiss(toastId),
  remove: (toastId?: string) => hotToast.remove(toastId),
  custom: (message: string) => hotToast(message)
};

export default toast; 