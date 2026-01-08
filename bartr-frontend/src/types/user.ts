// Shared type definitions for user-related data structures

export interface SkillsOffered {
  id?: number;
  skill: string;
}

export interface SkillsWanted {
  id?: number;
  skill: string;
}

export interface UserProfile {
  id?: number;
  keycloakId: string;
  firstName: string;
  lastName: string;
  gender: string;
  userName: string;
  email: string;
  bio?: string;
  credits?: number;
  lastActiveAt?: string;
  skillsOffered?: SkillsOffered[];
  skillsWanted?: SkillsWanted[];
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  gender: string;
  userName: string;
  bio: string;
  password: string;
  email: string;
  skillsOffered: string[];
  skillsWanted: string[];
}

export interface UpdateRequest {
  firstName?: string;
  lastName?: string;
  gender?: string;
  userName?: string;
  bio?: string;
  password?: string;
  email?: string;
  skillsOffered?: string[];
  skillsWanted?: string[];
}
