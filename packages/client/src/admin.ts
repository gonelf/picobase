import type PocketBase from 'pocketbase'
import type { CollectionModel } from './types' // Assuming types are updated

export class PicoBaseAdmin {
    private pb: PocketBase

    constructor(pb: PocketBase) {
        this.pb = pb
    }

    /**
     * Fetch a list of all collections.
     */
    async listCollections(): Promise<CollectionModel[]> {
        const result = await this.pb.send<{ items: CollectionModel[] }>('/api/collections', {
            method: 'GET',
        })
        return result.items || []
    }

    /**
     * Fetch a single collection by ID or name.
     */
    async getCollection(idOrName: string): Promise<CollectionModel> {
        return this.pb.send<CollectionModel>(`/api/collections/${idOrName}`, {
            method: 'GET',
        })
    }

    /**
     * Create a new collection.
     */
    async createCollection(data: Partial<CollectionModel>): Promise<CollectionModel> {
        return this.pb.send<CollectionModel>('/api/collections', {
            method: 'POST',
            body: data,
        })
    }

    /**
     * Update an existing collection.
     */
    async updateCollection(idOrName: string, data: Partial<CollectionModel>): Promise<CollectionModel> {
        return this.pb.send<CollectionModel>(`/api/collections/${idOrName}`, {
            method: 'PATCH',
            body: data,
        })
    }

    /**
     * Delete a collection.
     */
    async deleteCollection(idOrName: string): Promise<boolean> {
        try {
            await this.pb.send(`/api/collections/${idOrName}`, {
                method: 'DELETE',
            })
            return true
        } catch (e) {
            return false
        }
    }
}
