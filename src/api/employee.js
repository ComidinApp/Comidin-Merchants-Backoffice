import useSWR from 'swr';
import { useMemo } from 'react';
import axios from 'axios';
import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export async function getEmployee(email) {
  try {
    const URL = `ttp://localhost:3000/employee/email/${email}`;

    const response = await axios.get(URL);
    return response;
  } catch (error) {
    console.error('Error fetching employee:', error);
    throw error;
  }
}

export async function sendEmployeeVerificationCode(email) {
  const URL = `ttp://localhost:3000/auth/send-code`;

  try {
    const response = await axios.post(URL, { email });
    return response.data;
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw error;
  }
}

export async function changeEmployeePassword(email, code, newPassword) {
  const URL = `ttp://localhost:3000/auth/change-pass`;

  try {
    const response = await axios.post(URL, { email, code, newPassword });
    return response.data;
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw error;
  }
}
