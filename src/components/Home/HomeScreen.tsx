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
      {/* Main Content Container */}
      <div className="main-content">
        {/* Logo/Title */}
        <div className="title-section">
          <div className="logo-container">
            <img 
              src="/tastyshot-icon.png" 
              alt="TastyShot" 
              className="app-logo"
              width="120"
              height="120"
            />
          </div>
          <h1 className="main-title">TastyShot</h1>
          <p className="subtitle">Transform your food photos with AI</p>
        </div>

        {/* Main Options */}
        <div className="options-container">
          {/* Camera Option */}
          <div className="option-item">
            <button
              className="camera-btn"
              onClick={onCameraLaunch}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 12px 48px rgba(255, 107, 53, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(255, 107, 53, 0.3)';
              }}
            >
              📷
            </button>
            <div className="option-info">
              <h3>Launch Camera</h3>
              <p>Take a fresh photo with your camera</p>
            </div>
          </div>

          {/* OR Divider */}
          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">or</span>
            <div className="divider-line" />
          </div>

          {/* Upload Option */}
          <div className="option-item">
            <div
              className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
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
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p className="loading-text">Processing image...</p>
                </div>
              ) : (
                <>
                  <div className="upload-icon">📁</div>
                  <p className="upload-text">
                    {isDragOver ? '🎯 Drop your image here' : 'Click or drag to upload'}
                  </p>
                </>
              )}
            </div>
            
            <div className="option-info">
              <h3>Select Photo</h3>
              <p>Upload from your device or drag & drop</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="features-grid">
          {[
            { icon: '✨', text: 'AI Enhancement' },
            { icon: '🎨', text: 'Style Filters' },
            { icon: '⚡', text: 'Instant Results' },
            { icon: '📱', text: 'Mobile Ready' }
          ].map((feature, index) => (
            <div key={index} className="feature-badge">
              <span className="feature-icon">{feature.icon}</span>
              <span className="feature-text">{feature.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button
          className="history-btn"
          onClick={onHistoryClick}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          📸 History
        </button>
      </div>

      <style>{`
        .home-screen {
          min-height: 100vh;
          background-color: var(--color-tasty-black);
          color: white;
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 40px;
        }
        
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 24px 40px;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, transparent 100%);
          backdrop-filter: blur(20px);
          display: flex;
          justify-content: center;
          z-index: 10;
        }
        
        .history-btn {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 30px;
          color: white;
          padding: 16px 32px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: all 0.3s ease;
          backdrop-filter: blur(20px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .main-content {
          flex: 1;
          max-width: 1200px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 80px;
          margin: 0 auto;
          padding-bottom: 120px;
        }
        
        .title-section {
          text-align: center;
        }
        
        .logo-container {
          margin-bottom: 32px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .app-logo {
          display: block;
          filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.4));
          transition: all 0.3s ease;
          animation: float 6s ease-in-out infinite;
        }
        
        .app-logo:hover {
          filter: drop-shadow(0 12px 32px rgba(255, 107, 53, 0.3));
          transform: translateY(-4px) scale(1.05);
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        
        .main-title {
          font-size: 72px;
          font-weight: bold;
          background: linear-gradient(135deg, var(--color-tasty-orange) 0%, var(--color-tasty-red) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 16px;
          letter-spacing: -0.02em;
        }
        
        .subtitle {
          font-size: 24px;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 400;
          letter-spacing: 0.01em;
          margin: 0;
        }
        
        .options-container {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 60px;
          align-items: center;
          width: 100%;
          max-width: 900px;
        }
        
        .option-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }
        
        .camera-btn {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-tasty-orange) 0%, var(--color-tasty-red) 100%);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 64px;
          color: white;
          transition: all 0.3s ease;
          box-shadow: 0 8px 32px rgba(255, 107, 53, 0.3);
        }
        
        .upload-area {
          width: 280px;
          height: 160px;
          border: 2px dashed rgba(255, 255, 255, 0.3);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
          backdrop-filter: blur(12px);
          position: relative;
          overflow: hidden;
        }
        
        .upload-area::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, transparent 0%, rgba(255, 107, 53, 0.1) 50%, transparent 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .upload-area:hover::before {
          opacity: 1;
        }
        
        .upload-area:hover {
          border-color: rgba(255, 107, 53, 0.6);
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(255, 107, 53, 0.2);
        }
        
        .upload-area.drag-over {
          border-color: var(--color-tasty-orange);
          background: linear-gradient(135deg, rgba(255, 107, 53, 0.15) 0%, rgba(255, 107, 53, 0.05) 100%);
          transform: scale(1.02);
          box-shadow: 0 16px 40px rgba(255, 107, 53, 0.3);
        }
        
        .upload-area.drag-over::before {
          opacity: 1;
        }
        
        .upload-icon {
          font-size: 48px;
          margin-bottom: 12px;
          opacity: 0.7;
        }
        
        .upload-area.drag-over .upload-icon {
          opacity: 1;
        }
        
        .upload-text {
          font-size: 16px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.8);
          text-align: center;
          margin: 0;
          line-height: 1.3;
        }
        
        .upload-area.drag-over .upload-text {
          color: var(--color-tasty-orange);
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.2);
          border-top: 3px solid var(--color-tasty-orange);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .loading-text {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
          margin: 0;
        }
        
        .option-info {
          text-align: center;
        }
        
        .option-info h3 {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 12px 0;
          color: white;
        }
        
        .option-info p {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
          line-height: 1.4;
        }
        
        .divider {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          flex-direction: column;
          height: 100%;
        }
        
        .divider-line {
          width: 1px;
          height: 60px;
          background: linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
        }
        
        .divider-text {
          font-size: 16px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 8px 16px;
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }
        
        .features-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          width: 100%;
          max-width: 800px;
        }
        
        .feature-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
          transition: all 0.2s ease;
        }
        
        .feature-badge:hover {
          background-color: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
        }
        
        .feature-icon {
          font-size: 18px;
        }
        
        .feature-text {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
        }
        
        /* Tablet styles */
        @media (max-width: 1024px) {
          .main-content {
            gap: 60px;
          }
          
          .logo-container {
            margin-bottom: 28px;
          }
          
          .app-logo {
            width: 100px !important;
            height: 100px !important;
          }
          
          .main-title {
            font-size: 56px;
          }
          
          .subtitle {
            font-size: 20px;
          }
          
          .options-container {
            gap: 40px;
            max-width: 700px;
          }
          
          .camera-btn {
            width: 140px;
            height: 140px;
            font-size: 56px;
          }
          
          .upload-area {
            width: 240px;
            height: 140px;
          }
          
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
        }
        
        /* Mobile styles */
        @media (max-width: 768px) {
          .home-screen {
            padding: 20px;
          }
          
          .bottom-nav {
            padding: 16px 20px;
          }
          
          .history-btn {
            padding: 12px 24px;
            font-size: 14px;
          }
          
          .main-content {
            gap: 40px;
          }
          
          .logo-container {
            margin-bottom: 24px;
          }
          
          .app-logo {
            width: 80px !important;
            height: 80px !important;
          }
          
          .main-title {
            font-size: 42px;
          }
          
          .subtitle {
            font-size: 18px;
          }
          
          .options-container {
            grid-template-columns: 1fr;
            gap: 32px;
            max-width: 100%;
          }
          
          .divider {
            flex-direction: row;
          }
          
          .divider-line {
            width: 60px;
            height: 1px;
          }
          
          .camera-btn {
            width: 120px;
            height: 120px;
            font-size: 48px;
          }
          
          .upload-area {
            width: 100%;
            max-width: 280px;
          }
          
          .option-info h3 {
            font-size: 20px;
          }
          
          .option-info p {
            font-size: 14px;
          }
          
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          
          .feature-badge {
            padding: 8px 16px;
            gap: 8px;
          }
          
          .feature-icon {
            font-size: 16px;
          }
          
          .feature-text {
            font-size: 14px;
          }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};