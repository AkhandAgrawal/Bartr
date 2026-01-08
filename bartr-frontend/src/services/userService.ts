import { userApi } from './api';
import type { UserProfile, SignupRequest, UpdateRequest } from '../types/user';

export const userService = {
  signup: async (data: SignupRequest): Promise<UserProfile> => {
    const response = await userApi.post<UserProfile>('/v1/user/profile/signup/public', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<UserProfile> => {
    const response = await userApi.get<UserProfile>('/v1/user/profile/me');
    return response.data;
  },

  getUserByKeycloakId: async (keycloakId: string): Promise<UserProfile> => {
    const response = await userApi.get<UserProfile>('/v1/user/profile', {
      params: { keycloakId },
    });
    return response.data;
  },

  updateProfile: async (data: UpdateRequest): Promise<UserProfile> => {
    const response = await userApi.put<UserProfile>('/v1/user/profile/update', data);
    return response.data;
  },

  getUsersBySkill: async (skill: string): Promise<UserProfile[]> => {
    const response = await userApi.get<UserProfile[]>('/v1/user/profile/skills', {
      params: { skill },
    });
    return response.data;
  },

  getActiveUsersCount: async (): Promise<number> => {
    const response = await userApi.get<number>('/v1/user/profile/stats/active-users');
    return response.data;
  },
};

