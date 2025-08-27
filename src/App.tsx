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
    setCapturedImage(null);
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
        top: '16px',
        left: '16px',
        right: '16px',
        zIndex: 50,
        padding: '16px',
        backgroundColor: 'rgba(127, 29, 29, 0.9)',
        border: '1px solid rgb(185, 28, 28)',
        borderRadius: '8px',
        backdropFilter: 'blur(4px)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start' 
        }}>
          <div>
            <h3 style={{ 
              fontWeight: 'bold', 
              color: 'white', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em', 
              fontSize: '14px' 
            }}>
              ERROR
            </h3>
            <p style={{ 
              color: 'rgb(254, 202, 202)', 
              fontSize: '14px', 
              marginTop: '4px' 
            }}>
              {error}
            </p>
          </div>
          <button
            onClick={() => setError(null)}
            style={{
              color: 'rgb(252, 165, 165)',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              fontSize: '18px',
              padding: '0',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(254, 226, 226)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(252, 165, 165)'}
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'var(--color-tasty-black)' 
    }}>
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

    </div>
  );
}

export default App;