import type { CameraConstraints } from '../types';

export class CameraService {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  
  // iOS-optimized camera constraints
  private getConstraints(facingMode: 'user' | 'environment' = 'environment'): CameraConstraints {
    return {
      video: {
        facingMode,
        width: 1280,
        height: 720,
        frameRate: 30,
      },
    };
  }

  // Initialize camera with iOS optimizations
  async initializeCamera(
    videoElement: HTMLVideoElement,
    facingMode: 'user' | 'environment' = 'environment'
  ): Promise<void> {
    try {
      // Stop existing stream if any
      this.stopCamera();

      const constraints = this.getConstraints(facingMode);
      
      // Request camera access
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Configure video element
      videoElement.srcObject = this.stream;
      videoElement.autoplay = true;
      videoElement.playsInline = true; // Critical for iOS
      videoElement.muted = true; // Prevent audio issues
      
      this.videoElement = videoElement;

      // Wait for video to start playing
      await new Promise<void>((resolve, reject) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play()
            .then(() => resolve())
            .catch(reject);
        };
        videoElement.onerror = reject;
      });

    } catch (error) {
      console.error('Camera initialization failed:', error);
      throw this.handleCameraError(error);
    }
  }

  // Capture photo from video stream
  async capturePhoto(): Promise<string> {
    if (!this.videoElement || !this.stream) {
      throw new Error('Camera not initialized');
    }

    try {
      // Create canvas for photo capture
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not create canvas context');
      }

      // Set canvas dimensions to match video
      canvas.width = this.videoElement.videoWidth;
      canvas.height = this.videoElement.videoHeight;

      // Draw current video frame to canvas
      context.drawImage(this.videoElement, 0, 0);

      // Convert to blob and return data URL
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          } else {
            reject(new Error('Failed to capture photo'));
          }
        }, 'image/jpeg', 0.9);
      });

    } catch (error) {
      console.error('Photo capture failed:', error);
      throw new Error(`Failed to capture photo: ${error}`);
    }
  }

  // Convert data URL to File object for upload
  dataURLToFile(dataURL: string, fileName: string): File {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], fileName, { type: mime });
  }

  // Switch between front and back camera
  async switchCamera(): Promise<void> {
    if (!this.videoElement) {
      throw new Error('Camera not initialized');
    }

    // Determine current facing mode and switch
    const currentTrack = this.stream?.getVideoTracks()[0];
    const currentSettings = currentTrack?.getSettings();
    const newFacingMode = currentSettings?.facingMode === 'user' ? 'environment' : 'user';

    await this.initializeCamera(this.videoElement, newFacingMode);
  }

  // Stop camera stream
  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }

  // Check if camera is supported
  static isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  // Get available cameras
  static async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Failed to enumerate cameras:', error);
      return [];
    }
  }

  // Handle camera errors with user-friendly messages
  private handleCameraError(error: any): Error {
    if (error.name === 'NotAllowedError') {
      return new Error('Camera access denied. Please allow camera permissions and try again.');
    } else if (error.name === 'NotFoundError') {
      return new Error('No camera found on this device.');
    } else if (error.name === 'NotSupportedError') {
      return new Error('Camera not supported on this device.');
    } else if (error.name === 'OverconstrainedError') {
      return new Error('Camera constraints not supported. Trying with default settings.');
    } else {
      return new Error('Failed to access camera. Please try again.');
    }
  }
}