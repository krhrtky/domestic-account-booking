import { toast as hotToast, ToastOptions } from 'react-hot-toast'

const defaultOptions: ToastOptions = {
  duration: 4000,
  position: 'top-right',
}

export const toast = {
  success: (message: string, options?: ToastOptions) =>
    hotToast.success(message, { ...defaultOptions, duration: 4000, ...options }),

  error: (message: string | unknown, options?: ToastOptions) => {
    const errorMessage = typeof message === 'string'
      ? message
      : message instanceof Error
      ? message.message
      : 'An error occurred'
    return hotToast.error(errorMessage, { ...defaultOptions, duration: 5000, ...options })
  },
  
  info: (message: string, options?: ToastOptions) => 
    hotToast(message, { ...defaultOptions, ...options }),
}
