import { useCallback, useState } from 'react';

interface HomeScreenProps {
  onCameraLaunch: () => void;
  onPhotoSelect: (photoDataURL: string) => void;
  onHistoryClick: () => void;
}

export const HomeScreen = ({ onCameraLaunch, onPhotoSelect, onHistoryClick }: HomeScreenProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    setIsProcessingUpload(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        onPhotoSelect(result);
      }
      setIsProcessingUpload(false);
    };
    reader.onerror = () => {
      alert('Error reading file');
      setIsProcessingUpload(false);
    };
    reader.readAsDataURL(file);
  }, [onPhotoSelect]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileSelect(imageFile);
    } else {
      alert('Please drop a valid image file');
    }
  }, [handleFileSelect]);

  return (
    <div className="home-screen">
      {/* App Header */}
      <div className="app-header">
        <div className="header-content">
          <div className="app-brand">
            <img 
              src="/tastyshot-icon.png" 
              alt="TastyShot" 
              className="header-logo"
              width="32"
              height="32"
            />
            <div className="brand-text">
              <h1 className="app-name">TastyShot</h1>
              <p className="app-tagline">AI Food Photography</p>
            </div>
          </div>
          
          <button
            className="history-nav-btn"
            onClick={onHistoryClick}
            title="View Photo History"
          >
            📸 History
          </button>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="main-content">
        {/* Welcome Section */}
        <div className="welcome-section">
          <h2 className="welcome-title">Transform your food photos</h2>
          <p className="welcome-subtitle">Capture or upload a photo to get started with AI enhancement</p>
        </div>

        {/* Action Cards */}
        <div className="action-cards">
          {/* Camera Card */}
          <div className="action-card camera-card">
            <div className="card-icon">
              📷
            </div>
            <div className="card-content">
              <h3 className="card-title">Take Photo</h3>
              <p className="card-description">Launch camera to capture a fresh shot</p>
            </div>
            <button
              className="card-button camera-btn"
              onClick={onCameraLaunch}
            >
              Open Camera
            </button>
          </div>

          {/* Upload Card */}
          <div className="action-card upload-card">
            <div
              className={`card-drop-zone ${isDragOver ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => handleFileInputChange(e as any);
                input.click();
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
              
              {isProcessingUpload ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Processing...</p>
                </div>
              ) : (
                <div className="upload-content">
                  <div className="card-icon">
                    📁
                  </div>
                  <div className="card-content">
                    <h3 className="card-title">Select Photo</h3>
                    <p className="card-description">
                      {isDragOver ? '🎯 Drop your image here' : 'Click or drag to upload from device'}
                    </p>
                  </div>
                  <div className="card-button upload-btn">
                    Choose File
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Made By Credit */}
        <div className="made-by">
          <a href="https://ashrafali.net" target="_blank" rel="noopener noreferrer">
            Made by Ashraf ❤️
          </a>
        </div>
      </div>

      <style>{`
        .home-screen {
          min-height: 100vh;
          background-color: var(--color-tasty-black);
          color: white;
          display: flex;
          flex-direction: column;
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
        }
        
        /* App Header */
        .app-header {
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 16px 24px;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        
        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .app-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .header-logo {
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
        }
        
        .brand-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .app-name {
          font-size: 20px;
          font-weight: 700;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: var(--gradient-tasty);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .app-tagline {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 500;
        }
        
        .history-nav-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          color: white;
          padding: 10px 16px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .history-nav-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-1px);
        }
        
        /* Main Content */
        .main-content {
          flex: 1;
          max-width: 800px;
          width: 100%;
          margin: 0 auto;
          padding: 40px 24px;
          display: flex;
          flex-direction: column;
          gap: 40px;
        }
        
        /* Welcome Section */
        .welcome-section {
          text-align: center;
          padding: 20px 0;
        }
        
        .welcome-title {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 12px 0;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          line-height: 1.2;
        }
        
        .welcome-subtitle {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
          line-height: 1.5;
        }
        
        /* Action Cards */
        .action-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 20px 0;
        }
        
        .action-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: 200px;
        }
        
        .action-card:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }
        
        .card-icon {
          font-size: 32px;
          width: 56px;
          height: 56px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .card-content {
          flex: 1;
        }
        
        .card-title {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        
        .card-description {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
          line-height: 1.4;
        }
        
        .card-button {
          background: var(--gradient-tasty);
          border: none;
          border-radius: 12px;
          color: var(--color-tasty-black);
          padding: 12px 20px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: all 0.2s ease;
          margin-top: auto;
        }
        
        .card-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(255, 107, 53, 0.4);
        }
        
        /* Upload Card Specific */
        .card-drop-zone {
          cursor: pointer;
          border-radius: 12px;
          transition: all 0.3s ease;
          min-height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .card-drop-zone.drag-over {
          background: rgba(255, 215, 0, 0.1);
          border-color: var(--color-tasty-yellow);
        }
        
        .upload-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 1;
        }
        
        .upload-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 2px dashed rgba(255, 255, 255, 0.3);
          color: white;
          text-align: center;
          padding: 12px 20px;
          border-radius: 12px;
          margin-top: auto;
          transition: all 0.2s ease;
        }
        
        .card-drop-zone:hover .upload-btn {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.5);
        }
        
        /* Loading States */
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex: 1;
          min-height: 120px;
        }
        
        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-top: 2px solid var(--color-tasty-yellow);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Made By Credit */
        .made-by {
          margin-top: auto;
          text-align: center;
          padding: 20px 0;
        }
        
        .made-by a {
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .made-by a:hover {
          color: var(--color-tasty-yellow);
          text-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
        }
        
        /* Mobile Responsive */
        @media (max-width: 767px) {
          .home-screen {
            padding-left: max(16px, env(safe-area-inset-left));
            padding-right: max(16px, env(safe-area-inset-right));
          }
          
          .app-header {
            padding: 12px 16px;
          }
          
          .app-name {
            font-size: 18px;
          }
          
          .app-tagline {
            font-size: 10px;
          }
          
          .history-nav-btn {
            font-size: 12px;
            padding: 8px 12px;
          }
          
          .main-content {
            padding: 24px 16px;
            gap: 32px;
          }
          
          .welcome-title {
            font-size: 24px;
          }
          
          .welcome-subtitle {
            font-size: 14px;
          }
          
          .action-cards {
            grid-template-columns: 1fr;
            gap: 16px;
            margin: 16px 0;
          }
          
          .action-card {
            padding: 20px;
            min-height: 160px;
          }
          
          .card-icon {
            font-size: 28px;
            width: 48px;
            height: 48px;
          }
          
          .card-title {
            font-size: 16px;
          }
          
          .card-description {
            font-size: 13px;
          }
          
          .card-button {
            font-size: 12px;
            padding: 10px 16px;
          }
        }
        
        /* Tablet */
        @media (min-width: 768px) and (max-width: 1023px) {
          .main-content {
            max-width: 700px;
            padding: 32px 24px;
          }
          
          .welcome-title {
            font-size: 28px;
          }
          
          .action-cards {
            gap: 16px;
          }
          
          .action-card {
            min-height: 180px;
          }
        }
      `}</style>
    </div>
  );
};
