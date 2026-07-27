import api from './config';
import { User, ProfileUpdateData, UnreadCountResponse } from '../types';

const userAPI = {

    /**
     * Get all users
     * @returns All users
     */
    async getAllUsers(): Promise<User[]> {
        return api.get(`/api/user/list/all`);
    },

    /**
     * Get user profile
     * @param userId - The ID of the user to fetch
     * @returns User profile
     */
    async getProfile(userId: number): Promise<User> {
        return api.get(`/api/user/${userId}/details`);
    },

    /**
     * Update user profile
     * @param userId - The ID of the user to update
     * @param updates - The updates to apply to the user
     * @returns Updated user profile
     */
    async updateProfile(userId: number, updates: ProfileUpdateData): Promise<User> {
        return api.put(`/api/user/${userId}`, updates);
    },

    /**
     * Get unread message count for a user
     * @param userId - The ID of the user
     * @returns Unread count response
     */
    async getUnreadCount(userId: number): Promise<UnreadCountResponse> {
        return api.get(`/api/notification/user/${userId}/unread-count`);
    },
};

export default userAPI;