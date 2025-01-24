export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
}

export interface Token {
  token: string;
}

export interface safaricomAccessToken {
  safaricomAccessToken: string;
}


export interface MetaItem {
  name: string;
  Value: string | number
}