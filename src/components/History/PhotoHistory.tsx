import React, { useState, useEffect } from 'react';

interface PhotoHistoryItem {
  id: string;
  originalImage: string;
  editedImage?: string;
  prompt: string;
  timestamp: string;
}

interface PhotoHistoryProps {
  onBack: () => void;
  onPhotoSelect: (photo: PhotoHistoryItem) => void;
}

export const PhotoHistory: React.FC<PhotoHistoryProps> = ({
  onBack,
  onPhotoSelect,
}) => {
  const [photos, setPhotos] = useState<PhotoHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load photos from localStorage (IndexedDB implementation would go here in the future)
  useEffect(() => {
    const loadPhotos = () => {
      try {
        const storedPhotos = localStorage.getItem('tastyshot_photos');
        if (storedPhotos) {
          const parsedPhotos = JSON.parse(storedPhotos);
          setPhotos(parsedPhotos);
        }
      } catch (error) {
        console.error('Failed to load photo history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPhotos();
  }, []);

  // Delete photo from history
  const deletePhoto = (photoId: string) => {
    const updatedPhotos = photos.filter(photo => photo.id !== photoId);
    setPhotos(updatedPhotos);
    
    try {
      localStorage.setItem('tastyshot_photos', JSON.stringify(updatedPhotos));
    } catch (error) {
      console.error('Failed to delete photo from history:', error);
    }
  };

  // Download photo
  const downloadPhoto = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download photo:', error);
    }
  };

  // Share photo using Web Share API
  const sharePhoto = async (imageUrl: string, prompt: string) => {
    if (navigator.share) {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'tastyshot_edit.jpg', { type: 'image/jpeg' });
        
        await navigator.share({
          title: 'Tasty Shot Edit',
          text: `Edited with Tasty Shot: ${prompt}`,
          files: [file],
        });
      } catch (error) {
        console.error('Failed to share photo:', error);
        // Fallback to copy URL
        navigator.clipboard.writeText(imageUrl);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-tasty-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-tasty-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-tasty-white font-bold uppercase tracking-wider">
            LOADING HISTORY
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="photo-history">
      {/* Header */}
      <div className="history-header">
        <button
          onClick={onBack}
          className="back-button"
        >
          <span className="text-xl">←</span>
          <span className="font-bold uppercase tracking-wider">BACK</span>
        </button>
        
        <h1 className="font-bold text-lg uppercase tracking-widest">PHOTO HISTORY</h1>
        
        <div className="w-16"></div> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="history-content">
        {photos.length === 0 ? (
          // Empty State
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📸</div>
            <h2 className="text-xl font-bold mb-2 uppercase tracking-wider">
              NO PHOTOS YET
            </h2>
            <p className="text-tasty-white/70 mb-6">
              Start capturing and editing photos to see them here.
            </p>
            <button
              onClick={onBack}
              className="btn-primary"
            >
              TAKE FIRST PHOTO
            </button>
          </div>
        ) : (
          // Photos Grid
          <div className="photos-grid">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="photo-card"
                onClick={() => onPhotoSelect(photo)}
              >
                <div className="flex space-x-4">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    <div className="relative w-20 h-20 bg-gray-800 rounded-lg overflow-hidden">
                      <img
                        src={photo.editedImage || photo.originalImage}
                        alt="Photo thumbnail"
                        className="w-full h-full object-cover"
                      />
                      {photo.editedImage && (
                        <div className="absolute top-1 right-1 w-3 h-3 bg-tasty-yellow rounded-full"></div>
                      )}
                    </div>
                  </div>

                  {/* Photo Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-bold uppercase tracking-wider truncate">
                        {photo.prompt.substring(0, 30)}
                        {photo.prompt.length > 30 ? '...' : ''}
                      </p>
                      <span className="text-xs text-tasty-white/70 ml-2">
                        {new Date(photo.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <p className="text-xs text-tasty-white/70 mb-3 line-clamp-2">
                      {photo.prompt}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      {photo.editedImage && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadPhoto(photo.editedImage!, `tastyshot_${photo.id}.jpg`);
                            }}
                            className="text-xs bg-tasty-white/20 hover:bg-tasty-white/30 px-3 py-1 rounded uppercase tracking-wider transition-colors"
                          >
                            SAVE
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sharePhoto(photo.editedImage!, photo.prompt);
                            }}
                            className="text-xs bg-tasty-white/20 hover:bg-tasty-white/30 px-3 py-1 rounded uppercase tracking-wider transition-colors"
                          >
                            SHARE
                          </button>
                        </>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePhoto(photo.id);
                        }}
                        className="text-xs bg-red-900/50 hover:bg-red-900/70 px-3 py-1 rounded uppercase tracking-wider transition-colors"
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .photo-history {
          min-height: 100vh;
          background-color: var(--color-tasty-black);
          color: var(--color-tasty-white);
        }
        
        .history-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid rgb(31, 41, 55);
        }
        
        .back-button {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--color-tasty-white);
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.2s;
        }
        
        .back-button:hover {
          color: var(--color-tasty-yellow);
        }
        
        .history-content {
          padding: 16px;
        }
        
        .photos-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        
        .photo-card {
          background-color: rgba(31, 41, 55, 0.3);
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: background-color 0.2s;
          border: 1px solid rgba(75, 85, 99, 0.3);
        }
        
        .photo-card:hover {
          background-color: rgba(31, 41, 55, 0.5);
        }
        
        /* Desktop responsive layout */
        @media (min-width: 768px) {
          .history-content {
            padding: 24px 40px;
            max-width: 1200px;
            margin: 0 auto;
          }
          
          .photos-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
          }
        }
        
        @media (min-width: 1024px) {
          .history-content {
            padding: 40px 60px;
          }
          
          .photos-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 32px;
          }
          
          .photo-card {
            padding: 24px;
          }
        }
        
        @media (min-width: 1280px) {
          .photos-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        
        @media (min-width: 1536px) {
          .photos-grid {
            grid-template-columns: repeat(5, 1fr);
          }
        }
      `}</style>
    </div>
  );
};