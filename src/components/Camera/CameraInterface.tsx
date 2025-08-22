import React, { useEffect } from 'react';
import { useCamera } from '../../hooks/useCamera';

interface CameraInterfaceProps {
  onPhotoCapture: (photoDataURL: string) => void;
  onError: (error: string) => void;
}

export const CameraInterface: React.FC<CameraInterfaceProps> = ({
  onPhotoCapture,
  onError,
}) => {
  const {
    videoRef,
    isInitialized,
    isLoading,
    error,
    initializeCamera,
    capturePhoto,
    switchCamera,
    stopCamera,
    isSupported,
  } = useCamera();

  // Initialize camera on mount
  useEffect(() => {
    if (isSupported) {
      initializeCamera('environment'); // Start with back camera
    } else {
      onError('Camera not supported on this device');
    }

    return () => {
      stopCamera();
    };
  }, [initializeCamera, stopCamera, isSupported, onError]);

  // Handle errors
  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  // Handle photo capture
  const handleCapturePhoto = async () => {
    const photo = await capturePhoto();
    if (photo) {
      onPhotoCapture(photo);
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-tasty-black text-tasty-white">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">📱</div>
          <h2 className="text-2xl font-bold mb-2">CAMERA NOT SUPPORTED</h2>
          <p className="text-tasty-white/70">
            Your device doesn't support camera access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-tasty-black overflow-hidden">
      {/* Video Preview */}
      <div className="relative w-full h-screen">
        <video
          ref={videoRef}
          className="camera-viewfinder absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-tasty-black/80 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-tasty-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-tasty-white font-bold uppercase tracking-wider">
                INITIALIZING CAMERA
              </p>
            </div>
          </div>
        )}

        {/* Camera Controls Overlay */}
        {isInitialized && !isLoading && (
          <>
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-tasty-black/80 to-transparent">
              <div className="flex justify-between items-center">
                <div className="text-tasty-white font-bold text-lg uppercase tracking-widest">
                  TASTY SHOT
                </div>
                <div className="flex space-x-4">
                  {/* Flash indicator (placeholder) */}
                  <div className="w-8 h-8 rounded-full bg-tasty-white/20 flex items-center justify-center">
                    <span className="text-tasty-white text-sm">⚡</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Viewfinder Grid */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Rule of thirds grid */}
              <div className="w-full h-full opacity-30">
                {/* Vertical lines */}
                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-tasty-white"></div>
                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-tasty-white"></div>
                {/* Horizontal lines */}
                <div className="absolute top-1/3 left-0 right-0 h-px bg-tasty-white"></div>
                <div className="absolute top-2/3 left-0 right-0 h-px bg-tasty-white"></div>
              </div>
              
              {/* Center focus indicator */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-16 h-16 border-2 border-tasty-yellow rounded-full opacity-80">
                  <div className="w-2 h-2 bg-tasty-yellow rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-tasty-black/90 to-transparent">
              <div className="flex items-center justify-between">
                {/* Gallery/History button */}
                <button className="w-12 h-12 rounded-lg bg-tasty-white/20 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-tasty-white text-xl">📁</span>
                </button>

                {/* Capture button */}
                <button
                  onClick={handleCapturePhoto}
                  disabled={isLoading}
                  className="relative w-20 h-20 rounded-full bg-tasty-white border-4 border-tasty-black shadow-lg hover:scale-105 transition-transform duration-200 disabled:opacity-50"
                >
                  <div className="absolute inset-2 rounded-full bg-tasty-gradient"></div>
                </button>

                {/* Camera switch button */}
                <button
                  onClick={switchCamera}
                  disabled={isLoading}
                  className="w-12 h-12 rounded-lg bg-tasty-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-tasty-white/30 transition-colors disabled:opacity-50"
                >
                  <span className="text-tasty-white text-xl">🔄</span>
                </button>
              </div>

              {/* Instructions */}
              <div className="mt-4 text-center">
                <p className="text-tasty-white/70 text-sm uppercase tracking-wider">
                  TAP TO CAPTURE
                </p>
              </div>
            </div>
          </>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="absolute inset-0 bg-tasty-black/90 flex items-center justify-center">
            <div className="text-center p-8 max-w-sm">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-tasty-white mb-4 uppercase tracking-wider">
                CAMERA ERROR
              </h2>
              <p className="text-tasty-white/70 mb-6 text-sm">
                {error}
              </p>
              <button
                onClick={() => initializeCamera('environment')}
                className="btn-primary"
              >
                RETRY
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};