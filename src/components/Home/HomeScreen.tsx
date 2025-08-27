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
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-tasty-black)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative'
    }}>
      {/* History Button */}
      <button
        onClick={onHistoryClick}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          color: 'white',
          padding: '12px 16px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(8px)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        History
      </button>

      {/* Logo/Title */}
      <div style={{
        textAlign: 'center',
        marginBottom: '60px'
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, var(--color-tasty-orange) 0%, var(--color-tasty-red) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '8px',
          letterSpacing: '-0.02em'
        }}>
          TastyShot
        </h1>
        <p style={{
          fontSize: '18px',
          color: 'rgba(255, 255, 255, 0.7)',
          fontWeight: '400',
          letterSpacing: '0.01em'
        }}>
          Transform your food photos with AI
        </p>
      </div>

      {/* Main Options */}
      <div style={{
        display: 'flex',
        flexDirection: window.innerWidth > 768 ? 'row' : 'column',
        gap: '24px',
        width: '100%',
        maxWidth: '600px',
        alignItems: 'center'
      }}>
        {/* Camera Option */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <button
            onClick={onCameraLaunch}
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-tasty-orange) 0%, var(--color-tasty-red) 100%)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              color: 'white',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 32px rgba(255, 107, 53, 0.3)'
            }}
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
          <div style={{ textAlign: 'center' }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              margin: '0 0 8px 0',
              color: 'white'
            }}>
              Launch Camera
            </h3>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.6)',
              margin: 0,
              lineHeight: '1.4'
            }}>
              Take a fresh photo with your camera
            </p>
          </div>
        </div>

        {/* OR Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          margin: window.innerWidth > 768 ? '0 16px' : '16px 0'
        }}>
          <div style={{
            width: window.innerWidth > 768 ? '1px' : '40px',
            height: window.innerWidth > 768 ? '40px' : '1px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)'
          }} />
          <span style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            or
          </span>
          <div style={{
            width: window.innerWidth > 768 ? '1px' : '40px',
            height: window.innerWidth > 768 ? '40px' : '1px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)'
          }} />
        </div>

        {/* Upload Option */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              position: 'relative',
              width: '200px',
              height: '120px',
              border: `2px dashed ${isDragOver ? 'var(--color-tasty-orange)' : 'rgba(255, 255, 255, 0.3)'}`,
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backgroundColor: isDragOver ? 'rgba(255, 107, 53, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(8px)'
            }}
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
              <div style={{
                fontSize: '24px',
                animation: 'spin 1s linear infinite'
              }}>
                ⏳
              </div>
            ) : (
              <>
                <div style={{
                  fontSize: '32px',
                  marginBottom: '8px',
                  opacity: isDragOver ? 1 : 0.7
                }}>
                  📁
                </div>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: isDragOver ? 'var(--color-tasty-orange)' : 'rgba(255, 255, 255, 0.8)',
                  textAlign: 'center',
                  margin: 0,
                  lineHeight: '1.3'
                }}>
                  {isDragOver ? 'Drop your image here' : 'Click or drag to upload'}
                </p>
              </>
            )}
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              margin: '0 0 8px 0',
              color: 'white'
            }}>
              Select Photo
            </h3>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.6)',
              margin: 0,
              lineHeight: '1.4'
            }}>
              Upload from your device or drag & drop
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{
        marginTop: '60px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '20px',
        maxWidth: '500px'
      }}>
        {[
          { icon: '✨', text: 'AI Enhancement' },
          { icon: '🎨', text: 'Style Filters' },
          { icon: '⚡', text: 'Instant Results' },
          { icon: '📱', text: 'Mobile Ready' }
        ].map((feature, index) => (
          <div key={index} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)'
          }}>
            <span style={{ fontSize: '16px' }}>{feature.icon}</span>
            <span style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: '500'
            }}>
              {feature.text}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};