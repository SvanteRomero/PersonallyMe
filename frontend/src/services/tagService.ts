import api from './api';
import { Tag, TagCreateData } from '../types';

const TAGS_URL = '/tags/';

export const tagService = {
    /**
     * Get all tags for the user
     */
    async getTags(): Promise<Tag[]> {
        const response = await api.get<any>(TAGS_URL);
        // Handle paginated response
        if (response.data && response.data.results && Array.isArray(response.data.results)) {
            return response.data.results;
        }
        // Handle non-paginated response (array)
        if (Array.isArray(response.data)) {
            return response.data;
        }
        return [];
    },

    /**
     * Create a new custom tag
     */
    async createTag(data: TagCreateData): Promise<Tag> {
        const response = await api.post<Tag>(TAGS_URL, data);
        return response.data;
    },

    /**
     * Delete a custom tag
     */
    async deleteTag(id: number): Promise<void> {
        await api.delete(`${TAGS_URL}${id}/`);
    },

    /**
     * Update a custom tag
     */
    async updateTag(id: number, data: Partial<TagCreateData>): Promise<Tag> {
        const response = await api.patch<Tag>(`${TAGS_URL}${id}/`, data);
        return response.data;
    }
};

export default tagService;
