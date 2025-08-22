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
      <div className="fixed top-4 left-4 right-4 z-50 p-4 bg-red-900/90 border border-red-700 rounded-lg backdrop-blur-sm">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-white uppercase tracking-wider text-sm">
              ERROR
            </h3>
            <p className="text-red-200 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-300 hover:text-red-100 transition-colors"
          >
            <span className="text-lg">×</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-tasty-black">
      {renderError()}
      
      {currentView === 'camera' && (
        <CameraInterface
          onPhotoCapture={handlePhotoCapture}
          onError={handleError}
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

      {/* Floating Action Button for History (only on camera view) */}
      {currentView === 'camera' && (
        <button
          onClick={goToHistory}
          className="fixed bottom-6 left-6 w-14 h-14 bg-tasty-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-tasty-white/30 hover:bg-tasty-white/30 transition-colors z-40"
        >
          <span className="text-tasty-white text-xl">📁</span>
        </button>
      )}
    </div>
  );
}

export default App;