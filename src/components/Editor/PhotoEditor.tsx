import React, { useState } from 'react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { useGemini } from '../../hooks/useGemini';
import { useReplicate } from '../../hooks/useReplicate';
import { IconMap } from '../UI/IconMap';
import { ArrowLeft, Bot, Download } from 'lucide-react';
import type { GeminiModel } from '../../services/gemini';
import type { AIModel, FluxKontextSettings } from '../../types';

interface PhotoEditorProps {
  originalImage: string;
  onEditComplete: (editedImage: string) => void;
  onBack: () => void;
}

interface EditingIteration {
  id: string;
  image: string;
  prompt: string;
  timestamp: Date;
  analysis?: string;
}

export const PhotoEditor: React.FC<PhotoEditorProps> = ({
  originalImage,
  onEditComplete,
  onBack,
}) => {
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [editingHistory, setEditingHistory] = useState<EditingIteration[]>([]);
  const timelineRef = React.useRef<HTMLDivElement>(null);

  // Clean up localStorage storage
  const cleanupStorage = React.useCallback(() => {
    try {
      const photos = localStorage.getItem('tastyshot_photos');
      if (photos) {
        const parsed = JSON.parse(photos);
        if (Array.isArray(parsed) && parsed.length > 10) {
          // Keep only the 10 most recent photos
          const cleaned = parsed.slice(0, 10);
          localStorage.setItem('tastyshot_photos', JSON.stringify(cleaned));
          console.log(`Cleaned up storage: removed ${parsed.length - cleaned.length} old photos`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup storage:', error);
    }
  }, []);

  // Cleanup storage on component mount
  React.useEffect(() => {
    cleanupStorage();
  }, [cleanupStorage]);
  
  // Debug logging for image props
  React.useEffect(() => {
    console.log('PhotoEditor - originalImage prop:', originalImage?.substring(0, 50));
  }, [originalImage]);
  
  React.useEffect(() => {
    console.log('PhotoEditor - editedImage state:', editedImage?.substring(0, 50));
  }, [editedImage]);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(true); // Enable by default
  const [selectedModel, setSelectedModel] = useState<GeminiModel | AIModel | null>(null);
  const [modelType, setModelType] = useState<'gemini' | 'replicate'>('gemini');

  const gemini = useGemini();
  const replicate = useReplicate();

  // Get current service based on model type
  const currentService = modelType === 'gemini' ? gemini : replicate;

  // Initialize with original image as first iteration
  React.useEffect(() => {
    if (originalImage && editingHistory.length === 0) {
      const originalIteration: EditingIteration = {
        id: 'original',
        image: originalImage,
        prompt: 'Original Photo',
        timestamp: new Date(),
      };
      setEditingHistory([originalIteration]);
    }
  }, [originalImage, editingHistory.length]);

  // Add new iteration to history
  const addIterationToHistory = (image: string, prompt: string, analysis?: string) => {
    const newIteration: EditingIteration = {
      id: `edit-${Date.now()}`,
      image,
      prompt,
      timestamp: new Date(),
      analysis,
    };
    setEditingHistory(prev => {
      const newHistory = [...prev, newIteration];
      
      // Auto-scroll to bottom (newest edit) after state update
      setTimeout(() => {
        if (timelineRef.current) {
          timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
        }
      }, 100);
      
      return newHistory;
    });
  };

  // Save to localStorage history (PhotoHistory component)
  const saveToHistory = (editedImage: string, prompt: string) => {
    try {
      const photoHistoryItem = {
        id: `photo-${Date.now()}`,
        originalImage: originalImage,
        editedImage: editedImage,
        prompt: prompt,
        timestamp: new Date().toISOString(),
      };

      // Get existing photos
      const existingPhotos = localStorage.getItem('tastyshot_photos');
      let photos = existingPhotos ? JSON.parse(existingPhotos) : [];
      
      // Add new photo to the beginning
      photos.unshift(photoHistoryItem);
      
      // Limit to 20 photos to prevent storage overflow
      if (photos.length > 20) {
        photos = photos.slice(0, 20);
      }
      
      // Try to save, with fallback for quota exceeded
      try {
        localStorage.setItem('tastyshot_photos', JSON.stringify(photos));
        console.log('Photo saved to history:', photoHistoryItem);
      } catch (quotaError) {
        if (quotaError instanceof DOMException && quotaError.name === 'QuotaExceededError') {
          // Remove older photos and try again
          photos = photos.slice(0, 10);
          localStorage.setItem('tastyshot_photos', JSON.stringify(photos));
          console.log('Photo saved to history after cleanup:', photoHistoryItem);
        } else {
          throw quotaError;
        }
      }
      
    } catch (error) {
      console.error('Failed to save photo to history:', error);
      // Still show success to user since the edit worked
    }
  };
  
  // Combined available models (Gemini first, then Replicate)
  const allAvailableModels = [
    ...gemini.availableModels.map(model => ({ ...model, type: 'gemini' as const })),
    ...replicate.availableModels.map(model => ({ ...model, type: 'replicate' as const }))
  ];

  // Set default model if none selected (Gemini first)
  React.useEffect(() => {
    if (!selectedModel && allAvailableModels.length > 0) {
      const defaultModel = allAvailableModels[0];
      setSelectedModel(defaultModel);
      setModelType(defaultModel.type);
    }
  }, [allAvailableModels.length, selectedModel]);

  // Handle preset selection
  const handlePresetEdit = async (preset: any) => {
    if (!selectedModel) return;
    
    currentService.clearError();
    
    let result: string | null = null;
    
    if (modelType === 'gemini') {
      const geminiResult = await gemini.processImage(selectedModel as GeminiModel, originalImage, preset.prompt);
      if (geminiResult) {
        result = geminiResult.image;
        setAiAnalysis(geminiResult.analysis);
      }
    } else {
      // For Replicate models, use the settings format
      const defaultSettings = (selectedModel as AIModel).defaultSettings as FluxKontextSettings;
      const settings = {
        prompt: preset.prompt,
        guidance_scale: defaultSettings?.guidance_scale || 3.5,
        num_inference_steps: defaultSettings?.num_inference_steps || 25,
        width: defaultSettings?.width || 1024,
        height: defaultSettings?.height || 1024,
      };
      result = await replicate.runModel(selectedModel as AIModel, originalImage, settings);
      setAiAnalysis(null); // Clear analysis for Replicate models
    }

    console.log('PhotoEditor - editImage result:', result);
    console.log('PhotoEditor - result type:', typeof result);
    console.log('PhotoEditor - result length:', result?.length);
    
    if (result) {
      console.log('PhotoEditor - setting edited image to:', result);
      setEditedImage(result);
      onEditComplete(result);
      
      // Add to timeline history
      addIterationToHistory(result, preset.prompt, modelType === 'gemini' ? aiAnalysis : undefined);
      
      // Save to localStorage history
      saveToHistory(result, preset.prompt);
    }
  };

  // Handle custom prompt editing
  const handleCustomEdit = async () => {
    if (!customPrompt.trim() || !selectedModel) return;
    
    currentService.clearError();
    
    let result: string | null = null;
    
    if (modelType === 'gemini') {
      const geminiResult = await gemini.processImage(selectedModel as GeminiModel, originalImage, customPrompt);
      if (geminiResult) {
        result = geminiResult.image;
        setAiAnalysis(geminiResult.analysis);
      }
    } else {
      const defaultSettings = (selectedModel as AIModel).defaultSettings as FluxKontextSettings;
      const settings = {
        prompt: customPrompt,
        guidance_scale: defaultSettings?.guidance_scale || 3.5,
        num_inference_steps: defaultSettings?.num_inference_steps || 25,
        width: defaultSettings?.width || 1024,
        height: defaultSettings?.height || 1024,
      };
      result = await replicate.runModel(selectedModel as AIModel, originalImage, settings);
      setAiAnalysis(null); // Clear analysis for Replicate models
    }

    console.log('PhotoEditor - custom editImage result:', result);
    console.log('PhotoEditor - custom result type:', typeof result);
    
    if (result) {
      console.log('PhotoEditor - setting custom edited image to:', result);
      setEditedImage(result);
      onEditComplete(result);
      
      // Add to timeline history
      addIterationToHistory(result, customPrompt, modelType === 'gemini' ? aiAnalysis : undefined);
      
      // Save to localStorage history
      saveToHistory(result, customPrompt);
    }
  };

  // Handle save/download functionality
  const handleSave = async () => {
    const imageToSave = editedImage || originalImage;
    
    try {
      console.log('Starting download process...');
      console.log('Image to save type:', typeof imageToSave);
      console.log('Image starts with:', imageToSave.substring(0, 50));
      
      // For mobile devices, try Web Share API first (allows saving to Photos)
      if (navigator.share && 'canShare' in navigator) {
        try {
          // Convert base64 to blob
          const response = await fetch(imageToSave);
          const blob = await response.blob();
          const file = new File([blob], 'tastyshot-edited.jpg', { type: 'image/jpeg' });
          
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'TastyShot Enhanced Photo',
              text: 'Check out my AI-enhanced photo!',
              files: [file]
            });
            console.log('Successfully shared via Web Share API');
            return;
          }
        } catch (shareError) {
          console.log('Web Share API failed:', shareError);
        }
      }
      
      // Fallback: Traditional download
      console.log('Using traditional download method');
      const link = document.createElement('a');
      
      // Ensure we have a valid data URL
      if (imageToSave.startsWith('data:')) {
        link.href = imageToSave;
      } else if (imageToSave.startsWith('http')) {
        // If it's a URL, we need to fetch and convert to data URL
        const response = await fetch(imageToSave);
        const blob = await response.blob();
        link.href = URL.createObjectURL(blob);
      } else {
        throw new Error('Invalid image format for download');
      }
      
      link.download = `tastyshot-${editedImage ? 'enhanced' : 'original'}-${Date.now()}.jpg`;
      link.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        if (link.href.startsWith('blob:')) {
          URL.revokeObjectURL(link.href);
        }
      }, 100);
      
      console.log('Download initiated successfully');
      
    } catch (error) {
      console.error('Save failed:', error);
      
      // Show user-friendly error with alternative
      const message = `Unable to download automatically. Alternative methods:
      
1. Long-press the image above and select "Save Image"
2. Right-click the image and select "Save As..."
3. Take a screenshot of the enhanced photo

The image has been processed successfully - the download feature may not work in all browsers.`;
      
      alert(message);
    }
  };

  // Handle image upscaling (using Gemini's enhance feature)
  const handleUpscale = async (factor: 'x2' | 'x4') => {
    const imageToUpscale = editedImage || originalImage;
    if (!selectedModel) return;
    
    currentService.clearError();
    
    const upscalePrompt = `Using the provided image, create an enhanced version that is upscaled by ${factor === 'x2' ? '2x' : '4x'} with improved clarity, sharpness, and detail preservation. Maintain the original composition and colors while dramatically improving image quality and resolution.`;
    
    let result: string | null = null;
    
    if (modelType === 'gemini') {
      const geminiResult = await gemini.processImage(selectedModel as GeminiModel, imageToUpscale, upscalePrompt);
      if (geminiResult) {
        result = geminiResult.image;
        setAiAnalysis(geminiResult.analysis);
      }
    } else {
      const defaultSettings = (selectedModel as AIModel).defaultSettings as FluxKontextSettings;
      const settings = {
        prompt: upscalePrompt,
        guidance_scale: defaultSettings?.guidance_scale || 3.5,
        num_inference_steps: defaultSettings?.num_inference_steps || 25,
        width: defaultSettings?.width || 1024,
        height: defaultSettings?.height || 1024,
      };
      result = await replicate.runModel(selectedModel as AIModel, imageToUpscale, settings);
      setAiAnalysis(null); // Clear analysis for Replicate models
    }

    if (result) {
      setEditedImage(result);
      onEditComplete(result);
    }
  };


  return (
    <div className="photo-editor">
      {/* Header */}
      <div className="editor-header">
        <button
          onClick={onBack}
          className="back-button"
        >
          <ArrowLeft size={20} />
          <span className="font-bold uppercase tracking-wider">BACK</span>
        </button>
        
        <h1 className="font-bold text-lg uppercase tracking-widest">EDIT PHOTO</h1>
        
        <div></div>
      </div>

      {/* Main Content */}
      <div className="editor-content">
        {/* Image Display */}
        <div className="image-section">
          <div className="image-container">
            {comparisonMode && editedImage ? (
              // Before/After Comparison with ReactCompareSlider
              <div className="comparison-wrapper">
              <ReactCompareSlider
                itemOne={
                  <ReactCompareSliderImage
                    src={originalImage}
                    alt="Original"
                    style={{ objectFit: 'contain', width: '100%', height: '100%', maxHeight: '70vh' }}
                    onLoad={() => console.log('Original image loaded for comparison:', originalImage.substring(0, 50))}
                    onError={() => console.error('Original image failed to load for comparison')}
                  />
                }
                itemTwo={
                  <ReactCompareSliderImage
                    src={editedImage}
                    alt="Edited"
                    style={{ objectFit: 'contain', width: '100%', height: '100%', maxHeight: '70vh' }}
                    onLoad={() => console.log('Edited image loaded for comparison:', editedImage.substring(0, 50))}
                    onError={() => console.error('Edited image failed to load for comparison')}
                  />
                }
                position={50}
                style={{
                  width: '100%',
                  minHeight: '300px',
                  maxHeight: '70vh',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                changePositionOnHover={false}
                onlyHandleDraggable={true}
                handle={
                  <div style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#FFD700',
                    borderRadius: '50%',
                    border: '2px solid #000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'ew-resize',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                  }}>
                    <div style={{
                      width: '4px',
                      height: '16px',
                      backgroundColor: '#000',
                      borderRadius: '2px'
                    }} />
                  </div>
                }
                boundsPadding={0}
              />
              
              {/* Labels */}
              <div className="absolute top-4 left-4 bg-tasty-black/80 px-3 py-1 rounded text-sm font-bold uppercase tracking-wider z-10">
                ORIGINAL
              </div>
              <div className="absolute top-4 right-4 bg-tasty-black/80 px-3 py-1 rounded text-sm font-bold uppercase tracking-wider z-10">
                EDITED
              </div>
            </div>
          ) : (
            // Single Image View
            <div className="single-image-wrapper">
              <img
                src={editedImage || originalImage}
                alt={editedImage ? 'Edited' : 'Original'}
                className="single-image"
              />
            </div>
          )}
        </div>
        </div>

        {/* Controls Sidebar */}
        <div className="controls-sidebar">
          {/* Compare Toggle Switch */}
          <div className="sidebar-section">
            <div className="section-title">View Mode</div>
            <button
              onClick={() => setComparisonMode(!comparisonMode)}
              className="toggle-button"
              style={{
                backgroundColor: comparisonMode ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${comparisonMode ? 'var(--color-tasty-yellow)' : 'rgba(255, 255, 255, 0.1)'}`,
                color: comparisonMode ? 'var(--color-tasty-yellow)' : 'rgba(255, 255, 255, 0.8)',
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-2 rounded-full transition-all relative"
                  style={{
                    backgroundColor: comparisonMode ? 'var(--color-tasty-yellow)' : 'rgba(255, 255, 255, 0.3)',
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full bg-white transition-all absolute -top-0.5"
                    style={{
                      left: comparisonMode ? '8px' : '0px',
                    }}
                  />
                </div>
                <span className="text-sm font-medium">{comparisonMode ? 'Compare' : 'Single'}</span>
              </div>
            </button>
          </div>

          {/* AI Model Selection */}
          <div className="sidebar-section">
            <div className="section-title">AI Model</div>
            <div className="mb-2">
              <select
                value={selectedModel?.id || ''}
                onChange={(e) => {
                  const model = allAvailableModels.find(m => m.id === e.target.value);
                  if (model) {
                    setSelectedModel(model);
                    setModelType(model.type);
                  }
                }}
                className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
              >
                {allAvailableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} - {model.provider}
                  </option>
                ))}
              </select>
            </div>
            {selectedModel && (
              <div className="p-2 bg-gray-900/60 rounded border border-gray-700 text-xs">
                <div className="font-medium text-white mb-1">{selectedModel.name}</div>
                <div className="text-gray-400">{selectedModel.description}</div>
              </div>
            )}
          </div>

          {/* Editing Presets */}
          <div className="sidebar-section">
            <div className="section-title">Quick Edits</div>
            <div className="grid grid-cols-1 gap-2">
              {currentService.editingPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetEdit(preset)}
                  disabled={currentService.isProcessing || !selectedModel}
                  className="p-3 bg-gray-900/60 hover:bg-gray-800/80 border border-gray-700 rounded text-left transition-colors disabled:opacity-50 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <IconMap icon={preset.icon} size={16} />
                    <div>
                      <div className="font-medium text-white text-xs">{preset.name}</div>
                      <div className="text-gray-400 text-xs leading-tight mt-0.5">{preset.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Prompt */}
          <div className="sidebar-section">
            <div className="section-title">Custom Edit</div>
            <div className="space-y-2">
              <button
                onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                className="w-full p-2 bg-gray-900/60 border border-gray-700 rounded text-left font-medium text-white text-sm hover:bg-gray-800/80 transition-colors"
              >
                {showCustomPrompt ? '✕ Hide Custom' : '+ Custom Prompt'}
              </button>

              {showCustomPrompt && (
                <div className="space-y-2">
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Describe your edit..."
                    className="w-full p-2 bg-gray-900/60 border border-gray-700 rounded text-white text-sm resize-none focus:border-yellow-500 focus:outline-none"
                    rows={3}
                  />
                  <button
                    onClick={handleCustomEdit}
                    disabled={currentService.isProcessing || !customPrompt.trim() || !selectedModel}
                    className="w-full p-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-medium text-sm rounded transition-all disabled:opacity-50 hover:shadow-md"
                  >
                    {currentService.isProcessing ? 'Processing...' : 'Apply Edit'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {editedImage && (
            <div className="sidebar-section">
              <div className="section-title">Actions</div>
              
              {/* Storage Warning */}
              <div className="bg-amber-900/30 border border-amber-600/50 rounded p-2 mb-3">
                <p className="text-amber-200 text-xs font-medium mb-1">📱 Storage Limit</p>
                <p className="text-amber-300/80 text-xs leading-tight">
                  Only the last 20 photos are kept in history. <strong>Save your favorites!</strong>
                </p>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={handleSave}
                  className="w-full p-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-medium text-sm rounded hover:shadow-md transition-all"
                >
                  <Download size={16} className="inline mr-2" />
                  Save Photo
                </button>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpscale('x2')}
                    disabled={currentService.isProcessing}
                    className="p-2 bg-gray-900/60 border border-gray-700 text-white text-xs rounded hover:bg-gray-800/80 transition-colors disabled:opacity-50"
                  >
                    Upscale 2x
                  </button>
                  <button
                    onClick={() => handleUpscale('x4')}
                    disabled={currentService.isProcessing}
                    className="p-2 bg-gray-900/60 border border-gray-700 text-white text-xs rounded hover:bg-gray-800/80 transition-colors disabled:opacity-50"
                  >
                    Upscale 4x
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Editing Timeline */}
          {editingHistory.length > 1 && (
            <div className="sidebar-section">
              <div className="section-title">Editing Timeline</div>
              <div className="timeline-container" ref={timelineRef}>
                {editingHistory.map((iteration, index) => (
                  <div key={iteration.id} className="timeline-item">
                    <div className="timeline-header">
                      <div className="timeline-number">{index + 1}</div>
                      <div className="timeline-info">
                        <div className="timeline-prompt">{iteration.prompt}</div>
                        <div className="timeline-time">
                          {iteration.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="timeline-image-container">
                      <img
                        src={iteration.image}
                        alt={`Edit ${index + 1}`}
                        className="timeline-image"
                        onClick={() => {
                          setEditedImage(index === 0 ? null : iteration.image);
                          if (index > 0) {
                            onEditComplete(iteration.image);
                          }
                        }}
                      />
                      {iteration.analysis && (
                        <div className="timeline-analysis">
                          <Bot size={10} className="text-yellow-500" />
                          <span className="text-xs text-gray-400 truncate">{iteration.analysis}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Analysis */}
          {modelType === 'gemini' && aiAnalysis && (
            <div className="sidebar-section">
              <div className="section-title">AI Analysis</div>
              <div className="p-3 bg-gray-900/60 rounded border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Bot size={14} className="text-yellow-500" />
                  <span className="text-xs font-medium text-yellow-500">Analysis</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{aiAnalysis}</p>
              </div>
            </div>
          )}
        </div>

        {/* Processing Overlay */}
        {currentService.isProcessing && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white font-bold uppercase tracking-wider mb-2">
                PROCESSING...
              </p>
              {currentService.progress.length > 0 && (
                <p className="text-gray-300 text-sm">
                  {currentService.progress[currentService.progress.length - 1]}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Error Display with Gemini Response */}
        {currentService.error && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[200] p-4 bg-red-900/90 border border-red-700 rounded-lg backdrop-blur-sm max-w-md shadow-lg">
            <p className="text-red-200 text-sm font-semibold mb-2">AI Response:</p>
            
            {/* Show Gemini's actual text response if available */}
            {gemini.geminiTextResponse && (
              <div className="bg-gray-800/80 p-3 rounded mb-3 border-l-4 border-yellow-500">
                <p className="text-yellow-200 text-sm font-medium mb-1">Gemini says:</p>
                <p className="text-gray-200 text-sm italic leading-relaxed">{gemini.geminiTextResponse}</p>
              </div>
            )}
            
            <p className="text-red-200 text-xs mb-3">{currentService.error}</p>
            
            <div className="flex gap-2">
              {gemini.geminiTextResponse && (
                <button
                  onClick={() => {
                    // Auto-open custom prompt with refined suggestion
                    setShowCustomPrompt(true);
                    setCustomPrompt("Apply dramatic cinematic lighting, deep shadows, rich contrasts, and moody atmosphere to this image of a person. Create a professional, artistic portrait while maintaining the subject's features.");
                    currentService.clearError();
                  }}
                  className="text-xs bg-yellow-600 hover:bg-yellow-500 text-yellow-100 px-3 py-1 rounded font-medium transition-colors"
                >
                  TRY REFINED PROMPT
                </button>
              )}
              <button
                onClick={currentService.clearError}
                className="text-xs text-red-300 hover:text-red-100 px-3 py-1 rounded border border-red-600/50 hover:border-red-500 transition-colors"
              >
                DISMISS
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .photo-editor {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          height: 100vh;
          width: 100vw;
          background-color: var(--color-tasty-black);
          color: var(--color-tasty-white);
          display: grid;
          grid-template-rows: auto 1fr;
          grid-template-areas:
            "header"
            "main";
          overflow: hidden;
        }
        
        .editor-header {
          grid-area: header;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          background-color: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 100;
        }
        
        .back-button {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--color-tasty-white);
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.2s;
        }
        
        .back-button:hover {
          color: var(--color-tasty-yellow);
        }
        
        .editor-content {
          grid-area: main;
          display: grid;
          grid-template-columns: 1fr 320px;
          height: 100%;
          min-height: 0;
          overflow: hidden;
        }
        
        .image-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          overflow: hidden;
        }
        
        .image-container {
          position: relative;
          width: 100%;
          height: 100%;
          max-height: calc(100vh - 120px);
          display: flex;
          justify-content: center;
          align-items: center;
          flex: 1;
        }
        
        .single-image-wrapper {
          position: relative;
          width: 100%;
          max-width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          min-height: 300px;
        }
        
        .single-image {
          max-width: 100%;
          max-height: calc(100vh - 200px);
          width: auto;
          height: auto;
          object-fit: contain;
          display: block;
          border-radius: 8px;
        }
        
        .comparison-wrapper {
          width: 100%;
          height: 100%;
          max-height: calc(100vh - 200px);
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          background-color: rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .toggle-section {
          margin-top: 16px;
          display: flex;
          justify-content: center;
        }
        
        .comparison-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.2s;
          font-weight: bold;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
        }
        
        .controls-sidebar {
          padding: 16px;
          background-color: rgba(0, 0, 0, 0.9);
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          backdrop-filter: blur(10px);
          max-height: 100%;
        }
        
        .sidebar-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .section-title {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 2px;
        }
        
        .toggle-button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          width: 100%;
        }
        
        .toggle-button:hover {
          transform: translateY(-1px);
        }
        
        /* Timeline Styles */
        .timeline-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 300px;
          overflow-y: auto;
          padding: 4px;
        }
        
        .timeline-item {
          background-color: rgba(31, 41, 55, 0.4);
          border: 1px solid rgba(75, 85, 99, 0.3);
          border-radius: 8px;
          padding: 8px;
          transition: all 0.2s ease;
        }
        
        .timeline-item:hover {
          background-color: rgba(31, 41, 55, 0.6);
          border-color: rgba(255, 215, 0, 0.3);
        }
        
        .timeline-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        
        .timeline-number {
          width: 20px;
          height: 20px;
          background-color: var(--color-tasty-yellow);
          color: var(--color-tasty-black);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
          flex-shrink: 0;
        }
        
        .timeline-info {
          flex: 1;
          min-width: 0;
        }
        
        .timeline-prompt {
          font-size: 11px;
          font-weight: 500;
          color: white;
          line-height: 1.3;
          margin-bottom: 2px;
          word-break: break-word;
        }
        
        .timeline-time {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.5);
        }
        
        .timeline-image-container {
          position: relative;
        }
        
        .timeline-image {
          width: 100%;
          height: 60px;
          object-fit: cover;
          border-radius: 4px;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }
        
        .timeline-image:hover {
          opacity: 0.8;
        }
        
        .timeline-analysis {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 4px;
          padding: 2px 4px;
          background-color: rgba(0, 0, 0, 0.3);
          border-radius: 3px;
        }
        
        .timeline-analysis span {
          font-size: 9px;
          line-height: 1.2;
        }
        
        /* Desktop responsive layout */
        @media (min-width: 1024px) {
          .editor-content {
            display: grid;
            grid-template-columns: 1fr 400px;
            height: calc(100vh - 80px);
          }
          
          .image-section {
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 40px;
          }
          
          .image-container {
            max-width: none;
            max-height: 80vh;
          }
          
          .controls-sidebar {
            border-top: none;
            border-left: 1px solid rgb(31, 41, 55);
            overflow-y: auto;
            background-color: rgba(0, 0, 0, 0.3);
          }
        }
        
        @media (min-width: 1280px) {
          .editor-content {
            grid-template-columns: 1fr 500px;
          }
          
          .image-section {
            padding: 60px;
          }
        }
        
        /* Mobile responsive updates */
        @media (max-width: 767px) {
          .photo-editor {
            height: 100vh;
          }
          
          .editor-content {
            flex-direction: column;
            gap: 16px;
          }
          
          .image-section {
            flex: 1;
            padding: 12px;
          }
          
          .image-container {
            max-width: none;
            max-height: 50vh;
          }
          
          .single-image {
            max-height: 45vh;
          }
          
          .comparison-wrapper {
            max-height: 45vh;
            min-height: 200px;
          }
          
          .controls-sidebar {
            flex-shrink: 0;
            padding: 16px;
            max-height: none;
            overflow-y: auto;
            background-color: rgba(0, 0, 0, 0.3);
          }
        }
        
        /* Tablet layout */
        @media (min-width: 768px) and (max-width: 1023px) {
          .image-container {
            max-width: 40rem;
          }
          
          .single-image {
            max-height: 60vh;
          }
          
          .comparison-wrapper {
            max-height: 60vh;
          }
          
          .controls-sidebar {
            padding: 24px;
          }
        }
      `}</style>
    </div>
  );
};