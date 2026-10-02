import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

export async function staffLogin(email, pin) {
  const response = await axios.post(
    `${API_URL}/auth/staff-login`,
    {
      email,
      pin,
    },
    {
      withCredentials: true,
    }
  );

  return response.data;
}
