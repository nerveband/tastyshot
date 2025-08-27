import React, { useEffect, useCallback, useState } from 'react';
import { useCamera } from '../../hooks/useCamera';
import { SwitchCamera, AlertTriangle, Camera, History, Info, ArrowLeft, Zap, Grid3X3, Sun } from 'lucide-react';

interface CameraInterfaceProps {
  onPhotoCapture: (photoDataURL: string) => void;
  onError: (error: string) => void;
  onHistoryClick?: () => void;
  onBack?: () => void;
}

export const CameraInterface: React.FC<CameraInterfaceProps> = ({
  onPhotoCapture,
  onError,
  onHistoryClick,
  onBack,
}) => {
  const {
    videoRef,
    isInitialized,
    isLoading,
    error,
    initializeCamera,
    initializeCameraWithDevice,
    capturePhoto,
    switchCamera,
    stopCamera,
    isSupported,
  } = useCamera();

  const [showGrid, setShowGrid] = useState(true);
  const [flashEnabled, setFlashEnabled] = useState(false);
  // const [selectedFilter, setSelectedFilter] = useState('none');
  const [cameraCapabilities, setCameraCapabilities] = useState({
    hasFlash: false,
    hasMultipleCameras: false,
    supportedResolutions: [] as string[],
    deviceCount: 0,
    availableDevices: [] as MediaDeviceInfo[]
  });
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  // Detect camera capabilities
  const detectCameraCapabilities = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      setCameraCapabilities({
        hasFlash: false, // Flash detection is limited in web browsers
        hasMultipleCameras: videoDevices.length > 1,
        supportedResolutions: ['Auto'], // Simplified - actual resolution detection is complex
        deviceCount: videoDevices.length,
        availableDevices: videoDevices
      });

      // Set default camera if none selected
      if (!selectedCameraId && videoDevices.length > 0) {
        setSelectedCameraId(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.log('Camera capabilities detection failed:', error);
    }
  }, [selectedCameraId]);

  // Initialize camera on mount - wait for user interaction on iOS
  useEffect(() => {
    if (!isSupported) {
      onError('Camera not supported on this device');
      return;
    }

    // Detect capabilities but don't initialize camera automatically
    // This prevents permission dialogs from appearing without user interaction
    detectCameraCapabilities();

    return () => {
      stopCamera();
    };
  }, [isSupported, onError, detectCameraCapabilities, stopCamera]);

  // Handle errors
  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  // Keyboard shortcuts for desktop
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isLoading) {
        e.preventDefault();
        handleCapturePhoto();
      }
      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        setShowGrid(!showGrid);
      }
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        switchCamera();
      }
      if ((e.key === 'h' || e.key === 'H') && onHistoryClick) {
        e.preventDefault();
        onHistoryClick();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isLoading, showGrid, switchCamera, onHistoryClick]);

  // Handle photo capture
  const handleCapturePhoto = useCallback(async () => {
    const photo = await capturePhoto();
    if (photo) {
      onPhotoCapture(photo);
    }
  }, [capturePhoto, onPhotoCapture]);

  // Handle camera selection
  const handleCameraSelect = useCallback(async (deviceId: string) => {
    if (deviceId === selectedCameraId) return; // Same camera, no change needed
    
    try {
      setSelectedCameraId(deviceId);
      await initializeCameraWithDevice(deviceId);
    } catch (error) {
      console.error('Failed to switch to selected camera:', error);
      onError('Failed to switch camera. Please try again.');
    }
  }, [selectedCameraId, initializeCameraWithDevice, onError]);

  // Handle file upload
  // const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (file && file.type.startsWith('image/')) {
  //     const reader = new FileReader();
  //     reader.onload = (e) => {
  //       const result = e.target?.result;
  //       if (typeof result === 'string') {
  //         onPhotoCapture(result);
  //       }
  //     };
  //     reader.readAsDataURL(file);
  //   } else {
  //     onError('Please select a valid image file');
  //   }
  //   // Reset the input
  //   event.target.value = '';
  // };

  if (!isSupported) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        backgroundColor: 'var(--color-tasty-black)',
        color: 'var(--color-tasty-white)'
      }}>
        <div style={{ textAlign: 'center', padding: '32px' }}>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
            <Camera size={48} color="rgb(245, 245, 245)" />
          </div>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            marginBottom: '8px',
            textTransform: 'uppercase'
          }}>
            CAMERA NOT SUPPORTED
          </h2>
          <p style={{ color: 'rgba(245, 245, 245, 0.7)' }}>
            Your device doesn't support camera access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="camera-interface">
      {/* Desktop Header */}
      <div className="camera-header">
        {onBack ? (
          <button
            onClick={onBack}
            className="header-button"
            title="Back to Home"
          >
            <ArrowLeft size={20} />
            <span className="desktop-only">Back</span>
          </button>
        ) : (
          <div className="spacer"></div>
        )}
        
        <div className="title">
          <img src="/tastyshot-icon.png" alt="TastyShot" className="title-icon-img" width="32" height="32" />
          <span>TASTYSHOT</span>
          <div className="subtitle">AI Food Photography</div>
        </div>
        
        <div className="header-controls">
          <button
            onClick={() => {
              const helpText = `TastyShot Camera Help:

📸 CAPTURE CONTROLS:
• SPACE or Click - Take photo
• Tap on mobile - Capture

🎯 CAMERA CONTROLS:
• C - Switch camera (${cameraCapabilities.hasMultipleCameras ? `${cameraCapabilities.deviceCount} available` : 'single camera'})
• G - Toggle grid overlay
• Flash - ${cameraCapabilities.hasFlash ? 'Available' : 'Not supported on web'}

⌨️ KEYBOARD SHORTCUTS:
• SPACE - Capture photo  
• G - Toggle grid
• C - Switch camera
• H - View history

💡 PHOTO TIPS:
• Use natural light when possible
• Enable grid for rule of thirds composition
• Hold device steady for sharp photos
• Clean camera lens for best quality

📱 DEVICE INFO:
• ${cameraCapabilities.deviceCount} camera(s) detected
• Resolution: Auto (optimized)
• Format: JPEG, High Quality`;
              
              alert(helpText);
            }}
            className="header-button"
            title="Camera Help & Tips"
          >
            <Info size={20} />
            <span className="desktop-only">Help</span>
          </button>
        </div>
      </div>

      {/* Main Camera Content */}
      <div className="camera-content">
        {/* Left Sidebar - Controls */}
        <div className="left-sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">Camera Settings</h3>
            <div className="control-group">
              {/* Camera Selection Dropdown - Desktop Only */}
              {cameraCapabilities.availableDevices.length > 1 && (
                <div className="camera-selector">
                  <label className="selector-label">Camera Source:</label>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => handleCameraSelect(e.target.value)}
                    className="camera-select"
                    disabled={isLoading}
                  >
                    {cameraCapabilities.availableDevices.map((device, index) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`control-button ${showGrid ? 'active' : ''}`}
                title="Toggle Grid (G)"
              >
                <Grid3X3 size={20} />
                <span>Grid</span>
                {showGrid && <div className="active-indicator"></div>}
              </button>
              
              {cameraCapabilities.hasMultipleCameras && (
                <button
                  onClick={switchCamera}
                  className="control-button"
                  disabled={isLoading}
                  title={`Switch Camera (C) - ${cameraCapabilities.deviceCount} available`}
                >
                  <SwitchCamera size={20} />
                  <span>Flip</span>
                </button>
              )}
              
              {cameraCapabilities.hasFlash && (
                <button
                  onClick={() => setFlashEnabled(!flashEnabled)}
                  className={`control-button ${flashEnabled ? 'active' : ''}`}
                  title="Flash"
                >
                  <Zap size={20} />
                  <span>Flash</span>
                  {flashEnabled && <div className="active-indicator"></div>}
                </button>
              )}
            </div>
          </div>

          {onHistoryClick && (
            <div className="sidebar-section">
              <h3 className="sidebar-title">Quick Actions</h3>
              <div className="control-group">
                <button
                  onClick={onHistoryClick}
                  className="control-button"
                  title="View History (H)"
                >
                  <History size={20} />
                  <span>History</span>
                </button>
              </div>
            </div>
          )}

          {/* Keyboard Shortcuts Help - Desktop Only */}
          <div className="sidebar-section shortcuts desktop-only">
            <h3 className="sidebar-title">Shortcuts</h3>
            <div className="shortcut-list">
              <div className="shortcut-item">
                <kbd>SPACE</kbd>
                <span>Capture</span>
              </div>
              <div className="shortcut-item">
                <kbd>G</kbd>
                <span>Grid</span>
              </div>
              <div className="shortcut-item">
                <kbd>C</kbd>
                <span>Switch</span>
              </div>
              <div className="shortcut-item">
                <kbd>H</kbd>
                <span>History</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center - Camera View */}
        <div className="camera-viewport">
          <div className="viewfinder-container">
            <video
              ref={videoRef}
              className="camera-video"
              playsInline
              muted
              autoPlay
            />
            
            {/* Loading Overlay */}
            {isLoading && (
              <div className="camera-overlay loading-overlay">
                <div className="loading-content">
                  <div className="loading-spinner"></div>
                  <p className="loading-text">INITIALIZING CAMERA</p>
                </div>
              </div>
            )}

            {/* Camera Permission Overlay - iOS Safari fix */}
            {!isLoading && !isInitialized && (
              <div className="camera-overlay permission-overlay">
                <div className="permission-content">
                  <div className="permission-icon">📷</div>
                  <h3 className="permission-title">CAMERA ACCESS REQUIRED</h3>
                  <p className="permission-message">
                    Tap "Allow Camera" to enable photo capture
                  </p>
                  <button
                    className="allow-camera-btn"
                    onClick={async () => {
                      try {
                        await initializeCamera('environment');
                      } catch (error) {
                        console.error('Manual camera init failed:', error);
                        onError('Camera access denied. Please check your browser settings and try again.');
                      }
                    }}
                  >
                    ALLOW CAMERA
                  </button>
                </div>
              </div>
            )}

            {/* Viewfinder Grid */}
            {isInitialized && !isLoading && showGrid && (
              <div className="camera-grid">
                {/* Rule of thirds grid */}
                <div className="grid-lines">
                  <div className="grid-line vertical" style={{ left: '33.33%' }}></div>
                  <div className="grid-line vertical" style={{ left: '66.67%' }}></div>
                  <div className="grid-line horizontal" style={{ top: '33.33%' }}></div>
                  <div className="grid-line horizontal" style={{ top: '66.67%' }}></div>
                </div>
                
                {/* Center focus indicator */}
                <div className="focus-indicator">
                  <div className="focus-dot"></div>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="camera-overlay error-overlay">
                <div className="error-content">
                  <AlertTriangle size={48} className="error-icon" />
                  <h2 className="error-title">CAMERA ERROR</h2>
                  <p className="error-message">{error}</p>
                  <button
                    onClick={() => initializeCamera('environment')}
                    className="retry-button"
                  >
                    RETRY
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Capture Button - Always Visible */}
          <div className="capture-zone">
            <button
              onClick={handleCapturePhoto}
              disabled={isLoading}
              className="capture-button desktop-capture"
              title="Capture Photo (SPACE)"
            >
              <div className="capture-ring">
                <div className="capture-inner">
                  <Camera size={28} />
                </div>
              </div>
              <span className="capture-label">CAPTURE</span>
            </button>
          </div>
        </div>

        {/* Right Sidebar - Status & Info */}
        <div className="right-sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">Camera Status</h3>
            <div className="status-info">
              <div className="status-item">
                <div className={`status-dot ${isInitialized ? 'active' : ''}`}></div>
                <span>{isInitialized ? 'Camera Ready' : 'Initializing...'}</span>
              </div>
              <div className="status-item">
                <div className={`status-dot ${cameraCapabilities.hasMultipleCameras ? 'active' : ''}`}></div>
                <span>{cameraCapabilities.hasMultipleCameras ? `${cameraCapabilities.deviceCount} Cameras` : 'Single Camera'}</span>
              </div>
              <div className="status-item">
                <div className={`status-dot ${cameraCapabilities.hasFlash ? 'active' : 'inactive'}`}></div>
                <span>Flash {cameraCapabilities.hasFlash ? 'Available' : 'Not Supported'}</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">Photo Settings</h3>
            <div className="settings-list">
              <div className="setting-item">
                <span className="setting-label">Resolution</span>
                <span className="setting-value">Auto</span>
              </div>
              <div className="setting-item">
                <span className="setting-label">Format</span>
                <span className="setting-value">JPEG</span>
              </div>
              <div className="setting-item">
                <span className="setting-label">Quality</span>
                <span className="setting-value">High</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section tips">
            <h3 className="sidebar-title">Tips</h3>
            <div className="tips-list">
              <div className="tip-item">
                <Sun size={16} className="tip-icon" />
                <span>Use natural light when possible</span>
              </div>
              <div className="tip-item">
                <Grid3X3 size={16} className="tip-icon" />
                <span>Use the grid for better composition</span>
              </div>
              <div className="tip-item">
                <Camera size={16} className="tip-icon" />
                <span>Hold steady for sharp photos</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Controls - Only show on small screens */}
      <div className="mobile-controls">
        <div className="mobile-capture-row">
          {onHistoryClick && (
            <button
              onClick={onHistoryClick}
              className="mobile-action-button"
              disabled={isLoading}
            >
              <History size={24} />
            </button>
          )}

          <button
            onClick={handleCapturePhoto}
            disabled={isLoading}
            className="mobile-capture-button"
          >
            <div className="mobile-capture-inner"></div>
          </button>

          {cameraCapabilities.hasMultipleCameras ? (
            <button
              onClick={switchCamera}
              className="mobile-action-button"
              disabled={isLoading}
              title={`Switch Camera - ${cameraCapabilities.deviceCount} available`}
            >
              <SwitchCamera size={24} />
            </button>
          ) : (
            <div className="mobile-action-spacer"></div>
          )}
        </div>

        <div className="mobile-secondary-row">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`mobile-action-button ${showGrid ? 'active' : ''}`}
            title="Toggle Grid"
          >
            <Grid3X3 size={20} />
          </button>
        </div>

        <div className="mobile-instructions">
          <p>TAP TO CAPTURE</p>
        </div>
      </div>

      <style>{`
        /* Desktop-First Design */
        .camera-interface {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100vh;
          background: linear-gradient(135deg, #1a1a1a 0%, #000 100%);
          display: grid;
          grid-template-columns: 320px 1fr 280px;
          grid-template-rows: auto 1fr;
          grid-template-areas: 
            "header header header"
            "sidebar-left camera sidebar-right";
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        }
        
        /* Header */
        .camera-header {
          grid-area: header;
          padding: 20px 30px;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          min-height: 80px;
          z-index: 1000;
        }

        .header-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: var(--color-tasty-white);
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          font-weight: 500;
        }

        .header-button:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .title {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .title span {
          color: var(--color-tasty-white);
          font-weight: 800;
          font-size: 22px;
          letter-spacing: 0.15em;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .title-icon {
          color: var(--color-tasty-yellow);
        }

        .title-icon-img {
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .subtitle {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 400;
          letter-spacing: 0.08em;
          margin-top: 2px;
          text-transform: uppercase;
        }

        .spacer {
          width: 120px;
        }

        .desktop-only {
          display: inline;
        }

        /* Sidebars */
        .left-sidebar, .right-sidebar {
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(20px);
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          padding: 30px 20px;
          overflow-y: auto;
        }

        .right-sidebar {
          border-right: none;
          border-left: 1px solid rgba(255, 255, 255, 0.05);
          grid-area: sidebar-right;
        }

        .left-sidebar {
          grid-area: sidebar-left;
        }

        .sidebar-section {
          margin-bottom: 32px;
        }

        .sidebar-section.shortcuts {
          margin-top: auto;
        }

        .sidebar-title {
          color: var(--color-tasty-white);
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.9;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .camera-selector {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 8px;
        }

        .selector-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .camera-select {
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: var(--color-tasty-white);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          outline: none;
        }

        .camera-select:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .camera-select:focus {
          border-color: var(--color-tasty-yellow);
          box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
        }

        .camera-select:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .camera-select option {
          background: #1a1a1a;
          color: var(--color-tasty-white);
          padding: 8px;
        }

        .control-button {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          font-weight: 500;
          position: relative;
        }

        .control-button:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
          color: var(--color-tasty-white);
          transform: translateY(-1px);
        }

        .control-button.active {
          background: rgba(255, 215, 0, 0.15);
          border-color: rgba(255, 215, 0, 0.3);
          color: var(--color-tasty-yellow);
        }

        .control-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .active-indicator {
          position: absolute;
          right: 8px;
          width: 8px;
          height: 8px;
          background: var(--color-tasty-yellow);
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
        }

        .file-upload-wrapper {
          position: relative;
        }

        .file-input {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          z-index: 1;
        }

        .file-button {
          pointer-events: none;
        }

        /* Keyboard Shortcuts */
        .shortcut-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .shortcut-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }

        .shortcut-item kbd {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 10px;
          font-weight: 600;
          color: var(--color-tasty-white);
        }

        /* Status Info */
        .status-info, .settings-list, .tips-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .status-item, .setting-item, .tip-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
        }

        .status-dot.active {
          background: #10B981;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
        }

        .status-dot.inactive {
          background: #EF4444;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.3);
        }

        .setting-item {
          justify-content: space-between;
        }

        .setting-value {
          color: var(--color-tasty-yellow);
          font-weight: 500;
        }

        .tip-icon {
          color: var(--color-tasty-yellow);
          opacity: 0.8;
        }

        /* Camera Viewport */
        .camera-content {
          display: contents;
        }

        .camera-viewport {
          grid-area: camera;
          position: relative;
          background: #000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .viewfinder-container {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 0;
        }

        .camera-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        /* Camera Overlays */
        .camera-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .loading-overlay {
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(4px);
        }

        .error-overlay {
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(4px);
        }

        .loading-content, .error-content {
          text-align: center;
          padding: 40px;
        }

        .loading-spinner {
          width: 64px;
          height: 64px;
          border: 4px solid rgba(255, 215, 0, 0.3);
          border-top: 4px solid var(--color-tasty-yellow);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 24px;
        }

        .loading-text, .error-title {
          color: var(--color-tasty-white);
          font-weight: 700;
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 0;
        }

        .error-icon {
          color: var(--color-tasty-yellow);
          margin-bottom: 16px;
        }

        .error-message {
          color: rgba(255, 255, 255, 0.7);
          margin: 16px 0 32px;
          font-size: 14px;
          line-height: 1.5;
        }

        .retry-button {
          background: var(--gradient-tasty);
          color: var(--color-tasty-black);
          font-weight: 700;
          padding: 14px 28px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 14px;
          transition: transform 0.2s ease;
        }

        .retry-button:hover {
          transform: translateY(-2px);
        }

        /* Permission Overlay - iOS Safari fix */
        .permission-overlay {
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(10px);
        }

        .permission-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 40px;
        }

        .permission-icon {
          font-size: 64px;
          margin-bottom: 24px;
          opacity: 0.8;
        }

        .permission-title {
          color: var(--color-tasty-white);
          font-weight: 700;
          font-size: 18px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 0 0 16px 0;
        }

        .permission-message {
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 32px 0;
          font-size: 14px;
          line-height: 1.5;
        }

        .allow-camera-btn {
          background: var(--gradient-tasty);
          color: var(--color-tasty-black);
          font-weight: 700;
          padding: 16px 32px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 16px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(255, 107, 53, 0.3);
        }

        .allow-camera-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(255, 107, 53, 0.4);
        }

        .allow-camera-btn:active {
          transform: translateY(0);
        }

        /* Camera Grid */
        .camera-grid {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          opacity: 0.4;
          z-index: 5;
        }

        .grid-lines {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .grid-line {
          position: absolute;
          background: var(--color-tasty-white);
        }

        .grid-line.vertical {
          width: 1px;
          height: 100%;
        }

        .grid-line.horizontal {
          height: 1px;
          width: 100%;
        }

        .focus-indicator {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
          border: 2px solid var(--color-tasty-yellow);
          border-radius: 50%;
          opacity: 0.8;
        }

        .focus-dot {
          width: 6px;
          height: 6px;
          background: var(--color-tasty-yellow);
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        /* Desktop Capture Button */
        .capture-zone {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
        }

        .desktop-capture {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(20px);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 20px 24px;
          color: var(--color-tasty-white);
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .desktop-capture:hover {
          border-color: rgba(255, 215, 0, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
        }

        .desktop-capture:active {
          transform: translateY(0);
        }

        .desktop-capture:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .capture-ring {
          width: 80px;
          height: 80px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.3s ease;
        }

        .desktop-capture:hover .capture-ring {
          border-color: var(--color-tasty-yellow);
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
        }

        .capture-inner {
          width: 60px;
          height: 60px;
          background: var(--gradient-tasty);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-tasty-black);
          transition: all 0.3s ease;
        }

        .desktop-capture:hover .capture-inner {
          transform: scale(1.05);
        }

        .capture-label {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          opacity: 0.9;
        }

        /* Mobile Controls - Hidden on Desktop */
        .mobile-controls {
          display: none;
        }

        /* Animations */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Tablet Responsive */
        @media (max-width: 1200px) {
          .camera-interface {
            grid-template-columns: 280px 1fr 260px;
          }
          
          .left-sidebar, .right-sidebar {
            padding: 24px 16px;
          }
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .camera-interface {
            display: flex;
            flex-direction: column;
            grid-template-areas: none;
            grid-template-columns: none;
            grid-template-rows: none;
          }

          .camera-header {
            grid-area: none;
            padding: 16px 20px;
            padding-top: max(16px, env(safe-area-inset-top));
            min-height: 60px;
          }

          .title span {
            font-size: 18px;
          }

          .subtitle {
            display: none;
          }

          .desktop-only {
            display: none;
          }

          .header-button {
            padding: 8px;
            gap: 0;
          }

          .left-sidebar, .right-sidebar {
            display: none;
          }

          .camera-selector {
            display: none;
          }

          .camera-content {
            display: flex;
            flex-direction: column;
            flex: 1;
          }

          .camera-viewport {
            flex: 1;
            grid-area: none;
          }

          .capture-zone {
            display: none;
          }

          .mobile-controls {
            display: flex;
            flex-direction: column;
            padding: 20px;
            padding-bottom: max(20px, env(safe-area-inset-bottom));
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(20px);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            gap: 16px;
            z-index: 1000;
          }

          .mobile-capture-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
          }

          .mobile-capture-button {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: var(--color-tasty-white);
            border: 4px solid rgba(0, 0, 0, 0.8);
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
          }

          .mobile-capture-button:active {
            transform: scale(0.95);
          }

          .mobile-capture-inner {
            position: absolute;
            top: 4px;
            left: 4px;
            right: 4px;
            bottom: 4px;
            border-radius: 50%;
            background: var(--gradient-tasty);
          }

          .mobile-action-button {
            width: 52px;
            height: 52px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.8);
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .mobile-action-button:hover {
            background: rgba(255, 255, 255, 0.1);
            color: var(--color-tasty-white);
          }

          .mobile-action-button.active {
            background: rgba(255, 215, 0, 0.15);
            border-color: rgba(255, 215, 0, 0.3);
            color: var(--color-tasty-yellow);
          }

          .mobile-action-spacer {
            width: 52px;
            height: 52px;
          }

          .mobile-secondary-row {
            display: flex;
            justify-content: center;
            gap: 20px;
          }

          .mobile-file-upload {
            position: relative;
          }

          .mobile-file-input {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            cursor: pointer;
            z-index: 1;
          }

          .mobile-instructions {
            text-align: center;
          }

          .mobile-instructions p {
            color: rgba(255, 255, 255, 0.5);
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin: 0;
            font-weight: 500;
          }
        }
      `}</style>
    </div>
  );
};