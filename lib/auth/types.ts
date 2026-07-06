export interface User {
  id: number;
  username: string;
  email: string;
  display_name: string | null;
  failed_login_attempts: number;
  locked_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicUser {
  id: number;
  username: string;
  email: string;
  displayName: string | null;
}

export interface SessionRecord {
  id: string;
  user_id: number;
  token_hash: string;
  expires_at: string;
  created_at: string;
  last_seen_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export interface AuthSession {
  userId: number;
  sessionId: string;
  username: string;
  email: string;
  displayName: string | null;
}
