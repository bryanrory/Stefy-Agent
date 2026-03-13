export interface User {
  id: number;
  phone: string;
  name: string;
  created_at: Date;
}

export interface CreateUserInput {
  phone: string;
  name: string;
}
