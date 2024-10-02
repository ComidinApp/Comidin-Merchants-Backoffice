import useSWR from 'swr';
import { useMemo } from 'react';
import axios from 'axios';
import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export async function getCommerceById(id) {
  try {
    const URL = `http://localhost:3000/commerce/${id}`;

    const response = await axios.get(URL);
    return response;
  } catch (error) {
    console.error('Error fetching employee:', error);
    throw error;
  }
}

export async function createCommerce(commerce) {
  const URL = `http://localhost:3000/commerce`;

  try {
    const response = await axios.post(URL, commerce);
    return response.data;
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw error;
  }
}
