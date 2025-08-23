import { useState } from 'react';
import { CameraInterface } from './components/Camera/CameraInterface';
import { PhotoEditor } from './components/Editor/PhotoEditor';
import { PhotoHistory } from './components/History/PhotoHistory';

type View = 'camera' | 'editing' | 'history';

interface PhotoHistoryItem {
  id: string;
  originalImage: string;
  editedImage?: string;
  prompt: string;
  timestamp: string;
}

function App() {
  const [currentView, setCurrentView] = useState<View>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  // Save photo to localStorage (would be IndexedDB in production)
  const savePhotoToHistory = (photoData: Omit<PhotoHistoryItem, 'id' | 'timestamp'>) => {
    try {
      const existingPhotos = localStorage.getItem('tastyshot_photos');
      const photos = existingPhotos ? JSON.parse(existingPhotos) : [];
      
      const newPhoto: PhotoHistoryItem = {
        ...photoData,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };
      
      const updatedPhotos = [newPhoto, ...photos];
      localStorage.setItem('tastyshot_photos', JSON.stringify(updatedPhotos));
    } catch (err) {
      console.error('Failed to save photo to history:', err);
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

  // Return to camera view
  const returnToCamera = () => {
    setCurrentView('camera');
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
      
      {currentView === 'camera' && (
        <CameraInterface
          onPhotoCapture={handlePhotoCapture}
          onError={handleError}
          onHistoryClick={goToHistory}
        />
      )}
      
      {currentView === 'editing' && capturedImage && (
        <PhotoEditor
          originalImage={capturedImage}
          onEditComplete={handleEditComplete}
          onBack={returnToCamera}
        />
      )}
      
      {currentView === 'history' && (
        <PhotoHistory
          onBack={returnToCamera}
          onPhotoSelect={handleHistoryPhotoSelect}
        />
      )}

    </div>
  );
}

export default App;