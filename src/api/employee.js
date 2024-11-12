import useSWR from 'swr';
import { useMemo } from 'react';
import axios from 'axios';
import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export async function getEmployee(email) {
  try {
    const URL = `https://6pg61wv2-3000.brs.devtunnels.ms/employee/email/${email}`;

    const response = await axios.get(URL);
    return response;
  } catch (error) {
    console.error('Error fetching employee:', error);
    throw error;
  }
}

export async function sendEmployeeVerificationCode(email) {
  const URL = `https://6pg61wv2-3000.brs.devtunnels.ms/auth/send-code`;

  try {
    const response = await axios.post(URL, { email });
    return response.data;
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw error;
  }
}

export async function changeEmployeePassword(email, code, newPassword) {
  const URL = `https://6pg61wv2-3000.brs.devtunnels.ms/auth/change-pass`;

  try {
    const response = await axios.post(URL, { email, code, newPassword });
    return response.data;
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw error;
  }
}
