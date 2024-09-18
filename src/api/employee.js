import useSWR from 'swr';
import { useMemo } from 'react';
import axios from 'axios';
import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export function useGetEmployee(email) {
  const URL = `http://localhost:3000/employee/email/${email}`;

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      employee: data || null,
      employeeLoading: isLoading,
      employeeError: error,
      employeeValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
  console.log(memoizedValue);

  return memoizedValue;
}

export async function sendEmployeeVerificationCode(email) {
  const URL = `http://localhost:3000/auth/send-code`;

  try {
    const response = await axios.post(URL, { email });
    return response.data;
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw error;
  }
}

export async function changeEmployeePassword(email, code, newPassword) {
  const URL = `http://localhost:3000/auth/change-pass`;

  try {
    const response = await axios.post(URL, { email, code, newPassword });
    return response.data;
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw error;
  }
}
