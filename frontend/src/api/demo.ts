import axios from "axios";

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
}

// GET 
export const getUser = async (id: number): Promise<User> => {
  const response = await axios.get<User>(`https://api.example.com/api/users/${id}`);
  return response.data;
};

// POST
export const createUser = async (data: CreateUserRequest): Promise<User> => {
  const response = await axios.post<User>("https://api.example.com/api/users", data);
  return response.data;
};

