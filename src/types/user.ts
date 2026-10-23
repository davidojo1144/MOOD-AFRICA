export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
};

export type AuthResponse = {
  user: User;
  tokens: AuthTokens;
};
