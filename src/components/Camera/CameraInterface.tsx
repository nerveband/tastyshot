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
    <div style={{ 
      height: '100vh',
      width: '100vw',
      backgroundColor: 'var(--color-tasty-black)', 
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        paddingTop: 'max(16px, env(safe-area-inset-top))',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: '60px',
        flexShrink: 0,
        zIndex: 1000
      }}>
        <div style={{ 
          color: 'var(--color-tasty-white)', 
          fontWeight: 'bold', 
          fontSize: '18px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em'
        }}>
          TASTY SHOT
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'rgba(245, 245, 245, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '14px' }}>⚡</span>
          </div>
        </div>
      </div>

      {/* Camera Viewfinder Container */}
      <div style={{ 
        flex: 1,
        position: 'relative',
        backgroundColor: '#000',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 0
      }}>
        <video
          ref={videoRef}
          style={{ 
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
          playsInline
          muted
          autoPlay
        />
        
        {/* Loading Overlay */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                border: '4px solid var(--color-tasty-yellow)',
                borderTop: '4px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }}></div>
              <p style={{ 
                color: 'var(--color-tasty-white)', 
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontSize: '14px'
              }}>
                INITIALIZING CAMERA
              </p>
            </div>
          </div>
        )}

        {/* Viewfinder Grid (only when camera is ready) */}
        {isInitialized && !isLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            opacity: 0.3
          }}>
            {/* Rule of thirds grid */}
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              {/* Vertical lines */}
              <div style={{ 
                position: 'absolute', 
                left: '33.33%', 
                top: 0, 
                bottom: 0, 
                width: '1px', 
                backgroundColor: 'var(--color-tasty-white)' 
              }}></div>
              <div style={{ 
                position: 'absolute', 
                left: '66.67%', 
                top: 0, 
                bottom: 0, 
                width: '1px', 
                backgroundColor: 'var(--color-tasty-white)' 
              }}></div>
              {/* Horizontal lines */}
              <div style={{ 
                position: 'absolute', 
                top: '33.33%', 
                left: 0, 
                right: 0, 
                height: '1px', 
                backgroundColor: 'var(--color-tasty-white)' 
              }}></div>
              <div style={{ 
                position: 'absolute', 
                top: '66.67%', 
                left: 0, 
                right: 0, 
                height: '1px', 
                backgroundColor: 'var(--color-tasty-white)' 
              }}></div>
            </div>
            
            {/* Center focus indicator */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '64px',
              height: '64px',
              border: '2px solid var(--color-tasty-yellow)',
              borderRadius: '50%',
              opacity: 0.8
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: 'var(--color-tasty-yellow)',
                borderRadius: '50%',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}></div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ textAlign: 'center', padding: '32px', maxWidth: '300px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: 'var(--color-tasty-white)', 
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                CAMERA ERROR
              </h2>
              <p style={{ 
                color: 'rgba(245, 245, 245, 0.7)', 
                marginBottom: '24px', 
                fontSize: '14px' 
              }}>
                {error}
              </p>
              <button
                onClick={() => initializeCamera('environment')}
                style={{
                  background: 'var(--gradient-tasty)',
                  color: 'var(--color-tasty-black)',
                  fontWeight: 'bold',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                RETRY
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div style={{
        padding: '20px',
        paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '140px',
        flexShrink: 0,
        zIndex: 1000,
        borderTop: '1px solid rgba(245, 245, 245, 0.1)'
      }}>
        {/* Controls Row */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          width: '100%',
          maxWidth: '320px',
          marginBottom: '16px'
        }}>
          {/* Gallery/History button */}
          <button 
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              backgroundColor: 'rgba(245, 245, 245, 0.2)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              backdropFilter: 'blur(4px)'
            }}
            onTouchStart={() => {}}
          >
            <span style={{ fontSize: '24px' }}>📁</span>
          </button>

          {/* Capture button */}
          <button
            onClick={handleCapturePhoto}
            onTouchStart={() => {}}
            disabled={isLoading}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-tasty-white)',
              border: '4px solid var(--color-tasty-black)',
              position: 'relative',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
              transition: 'transform 0.15s',
              opacity: isLoading ? 0.5 : 1
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              right: '8px',
              bottom: '8px',
              borderRadius: '50%',
              background: 'var(--gradient-tasty)',
              pointerEvents: 'none'
            }}></div>
          </button>

          {/* Camera switch button */}
          <button
            onClick={switchCamera}
            onTouchStart={() => {}}
            disabled={isLoading}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              backgroundColor: 'rgba(245, 245, 245, 0.2)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              backdropFilter: 'blur(4px)',
              transition: 'backgroundColor 0.15s',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            <span style={{ fontSize: '24px' }}>🔄</span>
          </button>
        </div>

        {/* Instructions */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ 
            color: 'rgba(245, 245, 245, 0.7)', 
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: 0
          }}>
            TAP TO CAPTURE
          </p>
        </div>
      </div>
    </div>
  );
};