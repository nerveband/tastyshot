import { useState } from 'react';
import { HomeScreen } from './components/Home/HomeScreen';
import { CameraInterface } from './components/Camera/CameraInterface';
import { PhotoEditor } from './components/Editor/PhotoEditor';
import { PhotoHistory } from './components/History/PhotoHistory';

type View = 'home' | 'camera' | 'editing' | 'history';

interface PhotoHistoryItem {
  id: string;
  originalImage: string;
  editedImage?: string;
  prompt: string;
  timestamp: string;
}

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle camera launch
  const handleCameraLaunch = () => {
    setCurrentView('camera');
  };

  // Handle photo selection (from upload or drag & drop)
  const handlePhotoSelect = (photoDataURL: string) => {
    setCapturedImage(photoDataURL);
    setError(null); // Clear any existing errors
    setCurrentView('editing');
  };

  // Handle photo capture from camera
  const handlePhotoCapture = (photoDataURL: string) => {
    setCapturedImage(photoDataURL);
    setCurrentView('editing');
  };

  // Handle edit completion
  const handleEditComplete = (editedPhotoURL: string) => {
    // Save to history
    if (capturedImage) {
      const photoData = {
        originalImage: capturedImage,
        editedImage: editedPhotoURL,
        prompt: 'AI Enhanced Photo', // This would be the actual prompt used
      };
      savePhotoToHistory(photoData);
    }
  };

  // Compress image before saving to avoid quota issues
  const compressImageForStorage = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Compress to smaller dimensions and lower quality for storage
        const maxDimension = 400; // Small thumbnail for history
        let { width, height } = img;
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Very low quality for storage
        const compressed = canvas.toDataURL('image/jpeg', 0.3);
        resolve(compressed);
      };
      img.src = dataUrl;
    });
  };

  // Save photo to localStorage with compression and limits
  const savePhotoToHistory = async (photoData: Omit<PhotoHistoryItem, 'id' | 'timestamp'>) => {
    try {
      const existingPhotos = localStorage.getItem('tastyshot_photos');
      const photos = existingPhotos ? JSON.parse(existingPhotos) : [];
      
      // Compress images before saving
      const compressedOriginal = await compressImageForStorage(photoData.originalImage);
      const compressedEdited = photoData.editedImage 
        ? await compressImageForStorage(photoData.editedImage)
        : undefined;
      
      const newPhoto: PhotoHistoryItem = {
        ...photoData,
        originalImage: compressedOriginal,
        editedImage: compressedEdited,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };
      
      // Limit to last 20 photos to prevent quota issues
      const updatedPhotos = [newPhoto, ...photos].slice(0, 20);
      
      localStorage.setItem('tastyshot_photos', JSON.stringify(updatedPhotos));
      console.log('Photo saved to history successfully');
    } catch (err) {
      console.error('Failed to save photo to history:', err);
      // If still failing due to quota, remove older photos
      try {
        const existingPhotos = localStorage.getItem('tastyshot_photos');
        if (existingPhotos) {
          const photos = JSON.parse(existingPhotos);
          // Keep only the 5 most recent photos
          const reducedPhotos = photos.slice(0, 5);
          localStorage.setItem('tastyshot_photos', JSON.stringify(reducedPhotos));
          console.log('Reduced photo history due to storage limits');
        }
      } catch (finalErr) {
        console.error('Failed to clean up photo history:', finalErr);
        // Clear all photos as last resort
        localStorage.removeItem('tastyshot_photos');
        console.log('Cleared photo history due to persistent storage issues');
      }
    }
  };

  // Handle history photo selection
  const handleHistoryPhotoSelect = (photo: PhotoHistoryItem) => {
    setCapturedImage(photo.originalImage);
    setCurrentView('editing');
  };

  // Handle error display
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    
    // Auto-clear error after 5 seconds
    setTimeout(() => {
      setError(null);
    }, 5000);
  };

  // Return to home view
  const returnToHome = () => {
    setCurrentView('home');
    // Don't clear capturedImage to allow re-editing after going back
    setError(null);
  };

  // Navigate to history
  const goToHistory = () => {
    setCurrentView('history');
  };

  // Render error overlay
  const renderError = () => {
    if (!error) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 'max(16px, env(safe-area-inset-top))',
        left: 'max(16px, env(safe-area-inset-left))',
        right: 'max(16px, env(safe-area-inset-right))',
        zIndex: 1000,
        maxWidth: '500px',
        margin: '0 auto',
        padding: '20px 24px',
        backgroundColor: 'rgba(220, 38, 38, 0.95)',
        border: '1px solid rgba(239, 68, 68, 0.6)',
        borderRadius: '16px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
        animation: 'slideIn 0.3s ease-out'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          gap: '16px'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '18px' }}>⚠️</span>
              <h3 style={{ 
                fontWeight: '700', 
                color: 'white', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                fontSize: '12px',
                margin: '0'
              }}>
                ERROR
              </h3>
            </div>
            <p style={{ 
              color: 'rgb(254, 226, 226)', 
              fontSize: '15px', 
              lineHeight: '1.5',
              margin: '0',
              userSelect: 'text',
              cursor: 'text',
              fontWeight: '500'
            }}>
              {error}
            </p>
          </div>
          <button
            onClick={() => setError(null)}
            style={{
              color: 'rgba(255, 255, 255, 0.8)',
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              fontSize: '20px',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              minWidth: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
            }}
            title="Close error message"
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      {renderError()}
      
      {currentView === 'home' && (
        <HomeScreen
          onCameraLaunch={handleCameraLaunch}
          onPhotoSelect={handlePhotoSelect}
          onHistoryClick={goToHistory}
        />
      )}
      
      {currentView === 'camera' && (
        <CameraInterface
          onPhotoCapture={handlePhotoCapture}
          onError={handleError}
          onHistoryClick={goToHistory}
          onBack={returnToHome}
        />
      )}
      
      {currentView === 'editing' && capturedImage && (
        <PhotoEditor
          originalImage={capturedImage}
          onEditComplete={handleEditComplete}
          onBack={returnToHome}
        />
      )}
      
      {currentView === 'history' && (
        <PhotoHistory
          onBack={returnToHome}
          onPhotoSelect={handleHistoryPhotoSelect}
        />
      )}

      <style>{`
        .app-container {
          min-height: 100vh;
          background-color: var(--color-tasty-black);
          position: relative;
          overflow-x: hidden;
        }
        
        /* Error animation */
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        /* Global scrollbar styling */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        /* Selection styling */
        ::selection {
          background-color: rgba(255, 107, 53, 0.3);
          color: white;
        }
        
        ::-moz-selection {
          background-color: rgba(255, 107, 53, 0.3);
          color: white;
        }
        
        /* Focus outline for accessibility */
        button:focus-visible,
        input:focus-visible,
        textarea:focus-visible {
          outline: 2px solid var(--color-tasty-orange);
          outline-offset: 2px;
        }
        
        /* Smooth transitions for interactive elements */
        button, input, textarea {
          transition: all 0.2s ease;
        }
        
        /* Desktop-first responsive breakpoints */
        @media (max-width: 768px) {
          .app-container {
            /* Mobile adjustments handled in individual components */
          }
        }
        
        /* Reduce motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}

export default App;