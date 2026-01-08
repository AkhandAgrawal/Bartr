// Shared type definitions for matching-related data structures

export interface SwipeRequest {
  userId: string;
  swipedUserId: string;
  action: 'LEFT' | 'RIGHT';
}

export interface MatchDto {
  user1Id: string;
  user2Id: string;
  matchedDate: string;
}

export interface SwipeResponse {
  matchDto: MatchDto | null;
  matched: boolean;
}

export interface SkillsOfferedDto {
  skill: string;
}

export interface SkillsWantedDto {
  skill: string;
}

export interface UserDocument {
  keycloakId: string;
  firstName: string;
  lastName: string;
  gender: string;
  userName: string;
  email: string;
  skillsOffered: string[];
  skillsWanted: string[];
}

export interface MatchHistoryResponse {
  user1Id: string;
  user2Id: string;
  matchedDate: string;
  otherUser?: {
    keycloakId: string;
    firstName: string;
    lastName: string;
    userName: string;
    email: string;
  };
}
