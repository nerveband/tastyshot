import React, { useEffect } from 'react';
import { useCamera } from '../../hooks/useCamera';
import { FolderOpen, SwitchCamera, AlertTriangle, Camera, History, Info, ArrowLeft } from 'lucide-react';

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

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          onPhotoCapture(result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      onError('Please select a valid image file');
    }
    // Reset the input
    event.target.value = '';
  };

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
      {/* Header */}
      <div className="camera-header">
        {onBack ? (
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-tasty-white)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <ArrowLeft size={24} />
          </button>
        ) : (
          <div style={{ width: '32px', height: '32px' }}></div>
        )}
        
        <div style={{ 
          color: 'var(--color-tasty-white)', 
          fontWeight: 'bold', 
          fontSize: '18px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em'
        }}>
          TASTY SHOT
        </div>
        <div style={{ width: '32px', height: '32px' }}></div>
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
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                <AlertTriangle size={48} color="#FFD700" />
              </div>
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
        padding: '24px 20px',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '160px',
        flexShrink: 0,
        zIndex: 1000,
        borderTop: '1px solid rgba(245, 245, 245, 0.1)'
      }}>
        {/* Top Row - Secondary Actions */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          width: '100%',
          maxWidth: '200px',
          marginBottom: '24px'
        }}>
          {/* Upload Image button */}
          <div style={{ position: 'relative' }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer',
                zIndex: 1
              }}
            />
            <button 
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                transition: 'opacity 0.2s',
                pointerEvents: 'none'
              }}
            >
              <FolderOpen size={26} color="rgba(245, 245, 245, 0.8)" />
            </button>
          </div>

          {/* About button */}
          <button
            onClick={() => alert('Tasty Shot v1.0\n\nAI-powered food photography app\n\nTransform your food photos with professional AI enhancement using state-of-the-art models.')}
            onTouchStart={() => {}}
            disabled={isLoading}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              transition: 'opacity 0.2s',
              opacity: isLoading ? 0.5 : 0.8
            }}
          >
            <Info size={26} color="rgba(245, 245, 245, 0.8)" />
          </button>
        </div>

        {/* Main Action Row - Truly Centered Capture Button */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: '100%',
          position: 'relative',
          marginBottom: '16px'
        }}>
          {/* Left side button - History */}
          {onHistoryClick && (
            <button
              onClick={onHistoryClick}
              onTouchStart={() => {}}
              disabled={isLoading}
              style={{
                position: 'absolute',
                left: '0',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                transition: 'opacity 0.2s',
                opacity: isLoading ? 0.5 : 0.9
              }}
            >
              <History size={28} color="rgba(245, 245, 245, 0.9)" />
            </button>
          )}

          {/* Capture button - PERFECTLY CENTERED */}
          <button
            onClick={handleCapturePhoto}
            onTouchStart={() => {}}
            disabled={isLoading}
            style={{
              width: '88px',
              height: '88px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-tasty-white)',
              border: '5px solid rgba(0, 0, 0, 0.8)',
              position: 'relative',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              boxShadow: '0 12px 20px -3px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              transition: 'transform 0.15s, box-shadow 0.15s',
              opacity: isLoading ? 0.6 : 1
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.92)';
              e.currentTarget.style.boxShadow = '0 6px 12px -3px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 12px 20px -3px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 12px 20px -3px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)';
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 12px 20px -3px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)';
            }}
          >
            <div style={{
              position: 'absolute',
              top: '6px',
              left: '6px',
              right: '6px',
              bottom: '6px',
              borderRadius: '50%',
              background: 'var(--gradient-tasty)',
              pointerEvents: 'none'
            }}></div>
          </button>

          {/* Right side button - Camera Switch */}
          <button
            onClick={switchCamera}
            onTouchStart={() => {}}
            disabled={isLoading}
            style={{
              position: 'absolute',
              right: '0',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              transition: 'opacity 0.2s',
              opacity: isLoading ? 0.5 : 0.9
            }}
          >
            <SwitchCamera size={28} color="rgba(245, 245, 245, 0.9)" />
          </button>
        </div>

        {/* Instructions */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ 
            color: 'rgba(245, 245, 245, 0.6)', 
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            margin: 0,
            fontWeight: '500'
          }}>
            TAP TO CAPTURE
          </p>
        </div>
      </div>

      <style>{`
        .camera-interface {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          background-color: var(--color-tasty-black);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .camera-header {
          padding: 16px 20px;
          padding-top: max(16px, env(safe-area-inset-top));
          background-color: rgba(0, 0, 0, 0.9);
          display: flex;
          justify-content: space-between;
          align-items: center;
          min-height: 60px;
          flex-shrink: 0;
          z-index: 1000;
        }
        
        /* Desktop and tablet responsive layout */
        @media (min-width: 768px) {
          .camera-interface {
            display: grid;
            grid-template-columns: 350px 1fr 350px;
            grid-template-rows: auto 1fr;
            grid-template-areas: 
              "header header header"
              "sidebar-left camera sidebar-right";
          }
          
          .camera-header {
            grid-area: header;
            padding: 20px 30px;
          }
        }
        
        @media (min-width: 1200px) {
          .camera-interface {
            grid-template-columns: 400px 1fr 400px;
          }
        }
      `}</style>
    </div>
  );
};