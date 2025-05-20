import type { AxiosRequestConfig } from 'axios';

import axios from 'axios';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const axiosInstance = axios.create();

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject((error.response && error.response.data) || 'Something went wrong!')
);

export default axiosInstance;

// ----------------------------------------------------------------------

// Yeni Axios instance'ı SSR (Build Time) için
export const axiosSsr = axios.create({
  baseURL: CONFIG.serverUrl,
});

// SSR instance için de basit bir hata yakalayıcı ekleyebiliriz (isteğe bağlı)
axiosSsr.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('SSR Axios Error:', error.message); // Daha basit loglama
    return Promise.reject((error.response && error.response.data) || 'SSR API call failed');
  }
);

// ----------------------------------------------------------------------

export const fetcher = async (args: string | [string, AxiosRequestConfig]) => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args];

    const res = await axiosInstance.get(url, { ...config });

    return res.data;
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

export const endpoints = {
  chat: '/api/chat',
  kanban: '/api/kanban',
  calendar: '/api/calendar',
  auth: { me: '/api/auth/me', signIn: '/api/auth/sign-in', signUp: '/api/auth/sign-up' },
  mail: { list: '/api/mail/list', details: '/api/mail/details', labels: '/api/mail/labels' },
  post: {
    list: '/api/post/list',
    details: '/api/post/details',
    latest: '/api/post/latest',
    search: '/api/post/search',
  },
  product: {
    list: '/api/product/list',
    details: '/api/product/details',
    search: '/api/product/search',
  },
  news: {
    list: '/api/news/rss', // Yeni eklenen endpoint
  },
};
