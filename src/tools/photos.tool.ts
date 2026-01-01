import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { PhotosArgsSchema } from '../schemas/photos.schema.js';
import { createToolSchema } from '../utils/schema-helper.js';
import photosUtil from '../utils/photos.js';

export const PHOTOS_TOOL: Tool = {
  name: 'photos',
  description: 'Access Apple Photos - search photos, list albums, get recent photos',
  inputSchema: createToolSchema(PhotosArgsSchema)
};

export async function handlePhotos(args: unknown) {
  const parsed = PhotosArgsSchema.parse(args);

  try {
    switch (parsed.operation) {
      case 'search': {
        const photos = await photosUtil.searchPhotos(parsed.query, parsed.limit || 10);
        if (photos.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: `No photos found matching "${parsed.query}" (Photos search via scripting is limited)`
            }],
            isError: false
          };
        }
        const photosText = photos
          .map(p => `- ${p.name}\n  Filename: ${p.filename}${p.date ? `\n  Date: ${p.date}` : ''}${p.favorite ? '\n  (Favorite)' : ''}`)
          .join('\n\n');
        return {
          content: [{
            type: 'text' as const,
            text: photosText
          }],
          isError: false
        };
      }

      case 'listAlbums': {
        const albums = await photosUtil.listAlbums();
        if (albums.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: 'No albums found'
            }],
            isError: false
          };
        }
        const albumsText = albums
          .map(a => `- ${a.name} (${a.photoCount} photos)`)
          .join('\n');
        return {
          content: [{
            type: 'text' as const,
            text: `Albums:\n${albumsText}`
          }],
          isError: false
        };
      }

      case 'getRecent': {
        const photos = await photosUtil.getRecent(parsed.limit || 10);
        if (photos.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: 'No recent photos found'
            }],
            isError: false
          };
        }
        const photosText = photos
          .map(p => `- ${p.name}\n  Filename: ${p.filename}${p.date ? `\n  Date: ${p.date}` : ''}`)
          .join('\n\n');
        return {
          content: [{
            type: 'text' as const,
            text: `Recent photos:\n\n${photosText}`
          }],
          isError: false
        };
      }

      case 'getAlbumPhotos': {
        const photos = await photosUtil.getAlbumPhotos(parsed.albumName, parsed.limit || 20);
        if (photos.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: `No photos found in album "${parsed.albumName}"`
            }],
            isError: false
          };
        }
        const photosText = photos
          .map(p => `- ${p.name}\n  Filename: ${p.filename}${p.date ? `\n  Date: ${p.date}` : ''}`)
          .join('\n\n');
        return {
          content: [{
            type: 'text' as const,
            text: `Photos in "${parsed.albumName}":\n\n${photosText}`
          }],
          isError: false
        };
      }

      case 'getPhotoInfo': {
        const photo = await photosUtil.getPhotoInfo(parsed.photoId);
        if (!photo) {
          return {
            content: [{
              type: 'text' as const,
              text: `Photo with ID "${parsed.photoId}" not found`
            }],
            isError: false
          };
        }
        const infoText = [
          `Name: ${photo.name}`,
          `Filename: ${photo.filename}`,
          photo.date ? `Date: ${photo.date}` : null,
          photo.description ? `Description: ${photo.description}` : null,
          photo.favorite ? 'Favorite: Yes' : null,
          photo.keywords?.length ? `Keywords: ${photo.keywords.join(', ')}` : null,
          photo.location ? `Location: ${photo.location.latitude}, ${photo.location.longitude}` : null
        ].filter(Boolean).join('\n');
        return {
          content: [{
            type: 'text' as const,
            text: infoText
          }],
          isError: false
        };
      }

      default:
        return {
          content: [{
            type: 'text' as const,
            text: 'Unknown operation'
          }],
          isError: true
        };
    }
  } catch (error) {
    return {
      content: [{
        type: 'text' as const,
        text: `Error with Photos: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}
