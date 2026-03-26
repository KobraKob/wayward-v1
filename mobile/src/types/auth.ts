export interface User {
  id: string;
  email: string;
  name: string;
  city?: string;
  profile_json?: any;
}

export interface AuthResponse {
  access_token: string;
  user_id: string;
  name: string;
  email: string;
}
