import { matchingApi } from './api';
import type { SwipeRequest, SwipeResponse, UserDocument, MatchHistoryResponse } from '../types/matching';

export const matchingService = {
  getTopMatches: async (keycloakId: string): Promise<UserDocument[]> => {
    const response = await matchingApi.get<UserDocument[]>('/v1/matches/top', {
      params: { keycloakId },
    });
    return response.data;
  },

  swipe: async (data: SwipeRequest): Promise<SwipeResponse> => {
    const response = await matchingApi.post<SwipeResponse>('/v1/swipe', data);
    return response.data;
  },

  getMatchesCount: async (): Promise<number> => {
    const response = await matchingApi.get<number>('/v1/stats/matches');
    return response.data;
  },

  getMatchHistory: async (keycloakId: string): Promise<MatchHistoryResponse[]> => {
    const response = await matchingApi.get<MatchHistoryResponse[]>('/v1/matches/history', {
      params: { keycloakId },
    });
    return response.data;
  },

  unmatch: async (user1Id: string, user2Id: string): Promise<void> => {
    await matchingApi.delete('/v1/matches/unmatch', {
      params: { user1Id, user2Id },
    });
  },
};

