import { z } from 'zod';

const SearchPhotosSchema = z.object({
  operation: z.literal('search'),
  query: z.string().min(1, 'query is required for search operation').max(500).describe('Search query (uses ML-based photo recognition)'),
  limit: z.number().positive().max(500).optional().describe('Maximum number of photos to return')
});

const ListAlbumsSchema = z.object({
  operation: z.literal('listAlbums')
});

const GetRecentSchema = z.object({
  operation: z.literal('getRecent'),
  limit: z.number().positive().max(500).optional().describe('Number of recent photos to retrieve (default 10)')
});

const GetAlbumPhotosSchema = z.object({
  operation: z.literal('getAlbumPhotos'),
  albumName: z.string().min(1, 'albumName is required for getAlbumPhotos operation').max(500).describe('Name of the album to get photos from'),
  limit: z.number().positive().max(500).optional().describe('Maximum number of photos to return')
});

const GetPhotoInfoSchema = z.object({
  operation: z.literal('getPhotoInfo'),
  photoId: z.string().min(1, 'photoId is required for getPhotoInfo operation').max(500).describe('ID of the photo to get info for')
});

export const PhotosArgsSchema = z.discriminatedUnion('operation', [
  SearchPhotosSchema,
  ListAlbumsSchema,
  GetRecentSchema,
  GetAlbumPhotosSchema,
  GetPhotoInfoSchema
]);

export type PhotosArgs = z.infer<typeof PhotosArgsSchema>;
