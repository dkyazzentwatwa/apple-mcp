import { run } from '@jxa/run';
import { runAppleScript } from 'run-applescript';

interface Photo {
  id: string;
  name: string;
  filename: string;
  date: string | null;
  description: string | null;
  favorite: boolean;
  keywords: string[];
  location?: {
    latitude: number;
    longitude: number;
  } | null;
}

interface Album {
  id: string;
  name: string;
  photoCount: number;
}

/**
 * Check if Photos app is accessible
 */
async function checkPhotosAccess(): Promise<boolean> {
  try {
    await runAppleScript(`
      tell application "Photos"
        name
      end tell
    `);
    return true;
  } catch (error) {
    console.error(`Cannot access Photos: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Search photos by text (uses Photos' built-in search which includes ML recognition)
 */
async function searchPhotos(query: string, limit: number = 10): Promise<Photo[]> {
  try {
    if (!await checkPhotosAccess()) {
      return [];
    }

    const photos = await run((args: { query: string, limit: number }) => {
      const Photos = Application("Photos");
      Photos.activate();

      const results: Photo[] = [];

      try {
        // Search using Photos' search capabilities
        // Note: Photos app scripting is quite limited
        const searchResults = Photos.search({ for: args.query });

        const count = Math.min(searchResults.length, args.limit);
        for (let i = 0; i < count; i++) {
          try {
            const photo = searchResults[i];
            results.push({
              id: photo.id(),
              name: photo.name() || photo.filename(),
              filename: photo.filename(),
              date: photo.date() ? photo.date().toISOString() : null,
              description: photo.description() || null,
              favorite: photo.favorite(),
              keywords: photo.keywords() || [],
              location: photo.location() ? {
                latitude: photo.location().latitude,
                longitude: photo.location().longitude
              } : null
            });
          } catch (e) {
            // Skip photos we can't process
          }
        }
      } catch (e) {
        // Search might not be available in all versions
        console.log("Search error:", e);
      }

      return results;
    }, { query, limit }) as Photo[];

    // If JXA search didn't work, try via AppleScript approach
    if (photos.length === 0) {
      console.error("JXA search returned no results, Photos search is limited via scripting");
    }

    return photos;
  } catch (error) {
    console.error(`Error searching photos: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

/**
 * List all albums in Photos
 */
async function listAlbums(): Promise<Album[]> {
  try {
    if (!await checkPhotosAccess()) {
      return [];
    }

    const albums = await run(() => {
      const Photos = Application("Photos");
      const results: Album[] = [];

      try {
        const allAlbums = Photos.albums();

        for (const album of allAlbums) {
          try {
            results.push({
              id: album.id(),
              name: album.name(),
              photoCount: album.mediaItems().length
            });
          } catch (e) {
            // Skip albums we can't access
          }
        }
      } catch (e) {
        console.log("Error listing albums:", e);
      }

      return results;
    }) as Album[];

    return albums;
  } catch (error) {
    console.error(`Error listing albums: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

/**
 * Get recent photos from the library
 */
async function getRecent(limit: number = 10): Promise<Photo[]> {
  try {
    if (!await checkPhotosAccess()) {
      return [];
    }

    const photos = await run((limit: number) => {
      const Photos = Application("Photos");
      const results: Photo[] = [];

      try {
        // Get all media items and sort by date
        const allItems = Photos.mediaItems();

        // Get the most recent items
        const count = Math.min(allItems.length, limit);

        // Photos are typically returned in reverse chronological order
        for (let i = 0; i < count; i++) {
          try {
            const photo = allItems[i];
            results.push({
              id: photo.id(),
              name: photo.name() || photo.filename(),
              filename: photo.filename(),
              date: photo.date() ? photo.date().toISOString() : null,
              description: photo.description() || null,
              favorite: photo.favorite(),
              keywords: photo.keywords() || [],
              location: null // Skip location for performance
            });
          } catch (e) {
            // Skip photos we can't process
          }
        }
      } catch (e) {
        console.log("Error getting recent photos:", e);
      }

      return results;
    }, limit) as Photo[];

    return photos;
  } catch (error) {
    console.error(`Error getting recent photos: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

/**
 * Get photos from a specific album
 */
async function getAlbumPhotos(albumName: string, limit: number = 20): Promise<Photo[]> {
  try {
    if (!await checkPhotosAccess()) {
      return [];
    }

    const photos = await run((args: { albumName: string, limit: number }) => {
      const Photos = Application("Photos");
      const results: Photo[] = [];

      try {
        // Find the album
        const albums = Photos.albums.whose({ name: { _equals: args.albumName } })();

        if (albums.length === 0) {
          return results;
        }

        const album = albums[0];
        const items = album.mediaItems();
        const count = Math.min(items.length, args.limit);

        for (let i = 0; i < count; i++) {
          try {
            const photo = items[i];
            results.push({
              id: photo.id(),
              name: photo.name() || photo.filename(),
              filename: photo.filename(),
              date: photo.date() ? photo.date().toISOString() : null,
              description: photo.description() || null,
              favorite: photo.favorite(),
              keywords: photo.keywords() || [],
              location: null
            });
          } catch (e) {
            // Skip photos we can't process
          }
        }
      } catch (e) {
        console.log("Error getting album photos:", e);
      }

      return results;
    }, { albumName, limit }) as Photo[];

    return photos;
  } catch (error) {
    console.error(`Error getting album photos: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

/**
 * Get detailed info about a specific photo
 */
async function getPhotoInfo(photoId: string): Promise<Photo | null> {
  try {
    if (!await checkPhotosAccess()) {
      return null;
    }

    const photo = await run((id: string) => {
      const Photos = Application("Photos");

      try {
        // Find the photo by ID
        const items = Photos.mediaItems.whose({ id: { _equals: id } })();

        if (items.length === 0) {
          return null;
        }

        const photo = items[0];

        return {
          id: photo.id(),
          name: photo.name() || photo.filename(),
          filename: photo.filename(),
          date: photo.date() ? photo.date().toISOString() : null,
          description: photo.description() || null,
          favorite: photo.favorite(),
          keywords: photo.keywords() || [],
          location: photo.location() ? {
            latitude: photo.location().latitude,
            longitude: photo.location().longitude
          } : null
        };
      } catch (e) {
        console.log("Error getting photo info:", e);
        return null;
      }
    }, photoId) as Photo | null;

    return photo;
  } catch (error) {
    console.error(`Error getting photo info: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

export default {
  searchPhotos,
  listAlbums,
  getRecent,
  getAlbumPhotos,
  getPhotoInfo
};
