import { Resend } from 'resend';

// Singleton pattern ile Resend istemcisini oluşturma
let resendInstance: Resend | null = null;

export const getResend = () => {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      throw new Error('RESEND_API_KEY çevre değişkeni tanımlanmamış');
    }
    
    resendInstance = new Resend(apiKey);
  }
  
  return resendInstance;
};
