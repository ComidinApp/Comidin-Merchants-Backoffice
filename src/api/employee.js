import useSWR from 'swr';
import { useMemo } from 'react';
import axios from 'axios';
import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------
const { VITE_API_COMIDIN } = import.meta.env;

export async function getEmployee(email) {
  try {
    const URL = `${VITE_API_COMIDIN}/employee/email/${email}`;

    const response = await axios.get(URL);
    return response;
  } catch (error) {
    console.error('Error fetching employee:', error);
    throw error;
  }
}

export async function sendEmployeeVerificationCode(email) {
  const URL = `${VITE_API_COMIDIN}/auth/send-code`;

  try {
    const response = await axios.post(URL, { email });
    return response.data;
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw error;
  }
}

export async function changeEmployeePassword(email, code, newPassword) {
  const URL = `${VITE_API_COMIDIN}/auth/change-pass`;

  try {
    const response = await axios.post(URL, { email, code, newPassword });
    return response.data;
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw error;
  }
}
