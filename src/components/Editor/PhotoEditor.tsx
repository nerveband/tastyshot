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

export const PhotoEditor: React.FC<PhotoEditorProps> = ({
  originalImage,
  onEditComplete,
  onBack,
}) => {
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(true); // Enable by default
  const [selectedModel, setSelectedModel] = useState<GeminiModel | AIModel | null>(null);
  const [modelType, setModelType] = useState<'gemini' | 'replicate'>('replicate');

  const gemini = useGemini();
  const replicate = useReplicate();

  // Get current service based on model type
  const currentService = modelType === 'gemini' ? gemini : replicate;
  
  // Combined available models (Replicate first, then Gemini)
  const allAvailableModels = [
    ...replicate.availableModels.map(model => ({ ...model, type: 'replicate' as const })),
    ...gemini.availableModels.map(model => ({ ...model, type: 'gemini' as const }))
  ];

  // Set default model if none selected (Replicate first)
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
      result = await gemini.processImage(selectedModel as GeminiModel, originalImage, preset.prompt);
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
    }

    console.log('PhotoEditor - editImage result:', result);
    console.log('PhotoEditor - result type:', typeof result);
    console.log('PhotoEditor - result length:', result?.length);
    
    if (result) {
      console.log('PhotoEditor - setting edited image to:', result);
      setEditedImage(result);
      onEditComplete(result);
    }
  };

  // Handle custom prompt editing
  const handleCustomEdit = async () => {
    if (!customPrompt.trim() || !selectedModel) return;
    
    currentService.clearError();
    
    let result: string | null = null;
    
    if (modelType === 'gemini') {
      result = await gemini.processImage(selectedModel as GeminiModel, originalImage, customPrompt);
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
    }

    console.log('PhotoEditor - custom editImage result:', result);
    console.log('PhotoEditor - custom result type:', typeof result);
    
    if (result) {
      console.log('PhotoEditor - setting custom edited image to:', result);
      setEditedImage(result);
      onEditComplete(result);
    }
  };

  // Handle save/download functionality
  const handleSave = async () => {
    const imageToSave = editedImage || originalImage;
    
    try {
      // For mobile devices, try Web Share API first (allows saving to Photos)
      if (navigator.share && navigator.canShare) {
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
          return;
        }
      }
    } catch (error) {
      console.log('Web Share API not available or failed, falling back to download');
    }
    
    // Fallback: Traditional download
    try {
      const link = document.createElement('a');
      link.href = imageToSave;
      link.download = `tastyshot-${editedImage ? 'enhanced' : 'original'}-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Save failed:', error);
      // Show user-friendly error
      alert('Unable to save photo. Please try long-pressing the image and selecting "Save Image".');
    }
  };

  // Handle image upscaling (using Gemini's enhance feature)
  const handleUpscale = async (factor: 'x2' | 'x4') => {
    const imageToUpscale = editedImage || originalImage;
    if (!selectedModel) return;
    
    currentService.clearError();
    
    const upscalePrompt = `Enhance and upscale this image by ${factor === 'x2' ? '2x' : '4x'} with improved clarity, sharpness, and detail preservation. Maintain the original composition and colors.`;
    
    let result: string | null = null;
    
    if (modelType === 'gemini') {
      result = await gemini.processImage(selectedModel as GeminiModel, imageToUpscale, upscalePrompt);
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
    }

    if (result) {
      setEditedImage(result);
      onEditComplete(result);
    }
  };


  return (
    <div className="min-h-screen bg-tasty-black text-tasty-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-tasty-white hover:text-tasty-yellow transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-bold uppercase tracking-wider">BACK</span>
        </button>
        
        <h1 className="font-bold text-lg uppercase tracking-widest">EDIT PHOTO</h1>
        
        <div></div>
      </div>

      {/* Image Display */}
      <div className="relative flex-1 p-4">
        <div className="relative max-w-2xl mx-auto">
          {comparisonMode && editedImage ? (
            // Before/After Comparison with ReactCompareSlider
            <div className="w-full aspect-square bg-gray-900 rounded-lg overflow-hidden">
              <ReactCompareSlider
                itemOne={
                  <ReactCompareSliderImage
                    src={originalImage}
                    alt="Original"
                    style={{ objectFit: 'cover' }}
                  />
                }
                itemTwo={
                  <ReactCompareSliderImage
                    src={editedImage}
                    alt="Edited"
                    style={{ objectFit: 'cover' }}
                  />
                }
                position={50}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '8px',
                  overflow: 'hidden'
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
            <div className="w-full aspect-square bg-gray-900 rounded-lg overflow-hidden">
              <img
                src={editedImage || originalImage}
                alt={editedImage ? 'Edited' : 'Original'}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Compare Toggle Switch - Positioned beneath photo */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setComparisonMode(!comparisonMode)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-all font-bold text-sm uppercase tracking-wider"
            style={{
              backgroundColor: comparisonMode ? 'rgba(255, 215, 0, 0.1)' : 'rgba(245, 245, 245, 0.1)',
              border: `1px solid ${comparisonMode ? 'var(--color-tasty-yellow)' : 'rgba(245, 245, 245, 0.2)'}`,
              color: comparisonMode ? 'var(--color-tasty-yellow)' : 'var(--color-tasty-white)',
            }}
          >
            <div
              className="w-4 h-2 rounded-full transition-all"
              style={{
                backgroundColor: comparisonMode ? 'var(--color-tasty-yellow)' : 'rgba(245, 245, 245, 0.3)',
                position: 'relative'
              }}
            >
              <div
                className="w-2 h-2 rounded-full bg-white transition-all absolute top-0"
                style={{
                  left: comparisonMode ? '8px' : '0px',
                  transform: 'translateY(-1px)'
                }}
              />
            </div>
            <span>{comparisonMode ? 'COMPARE ON' : 'COMPARE OFF'}</span>
          </button>
        </div>

        {/* Mobile-First Save Action */}
        {editedImage && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleSave}
              className="flex items-center space-x-3 px-6 py-4 bg-gradient-to-r from-tasty-yellow to-tasty-orange text-tasty-black font-bold text-lg uppercase tracking-wider rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg"
              style={{
                background: 'var(--gradient-tasty)',
                boxShadow: '0 8px 24px rgba(255, 215, 0, 0.4)'
              }}
            >
              <Download size={24} />
              <span>SAVE TO PHOTOS</span>
            </button>
          </div>
        )}

        {/* Processing Overlay */}
        {currentService.isProcessing && (
          <div className="absolute inset-0 bg-tasty-black/80 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-tasty-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-tasty-white font-bold uppercase tracking-wider mb-2">
                PROCESSING...
              </p>
              {currentService.progress.length > 0 && (
                <p className="text-tasty-white/70 text-sm">
                  {currentService.progress[currentService.progress.length - 1]}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {currentService.error && (
        <div className="p-4 mx-4 bg-red-900/50 border border-red-700 rounded-lg mb-4">
          <p className="text-red-200 text-sm">{currentService.error}</p>
          <button
            onClick={currentService.clearError}
            className="mt-2 text-xs text-red-300 hover:text-red-100"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* AI Model Selection */}
      <div className="p-4 border-t border-gray-800 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm uppercase tracking-wider text-tasty-white">
            AI MODEL
          </h3>
          <span className="text-xs font-bold uppercase tracking-wider text-tasty-yellow">
            {modelType === 'gemini' ? 'POWERED BY GOOGLE' : 'POWERED BY REPLICATE'}
          </span>
        </div>
        
        {/* Model Dropdown */}
        <div className="mb-3">
          <select
            value={selectedModel?.id || ''}
            onChange={(e) => {
              const model = allAvailableModels.find(m => m.id === e.target.value);
              if (model) {
                setSelectedModel(model);
                setModelType(model.type);
              }
            }}
            className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-tasty-white text-sm"
          >
            {allAvailableModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} - {model.provider}
              </option>
            ))}
          </select>
        </div>

        {selectedModel && (
          <div className="p-3 bg-gray-900 rounded-lg border border-gray-700">
            <div className="flex items-center space-x-2 mb-1">
              <div className="flex items-center justify-center">
                <Bot size={18} color="rgb(245, 245, 245)" />
              </div>
              <span className="font-bold text-tasty-white uppercase tracking-wider text-sm">
                {selectedModel.name}
              </span>
              <span className="px-2 py-1 bg-gray-700 text-xs text-tasty-white/70 rounded uppercase tracking-wider">
                {selectedModel.provider}
              </span>
            </div>
            <p className="text-xs text-tasty-white/70 mb-2">
              {selectedModel.description}
            </p>
            <div className="flex items-center space-x-3 text-xs text-tasty-white/50">
              <span>Cost: {selectedModel.cost} credits</span>
              {selectedModel.estimatedTime && (
                <span>Time: {selectedModel.estimatedTime}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Editing Presets */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {currentService.editingPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetEdit(preset)}
              disabled={currentService.isProcessing || !selectedModel}
              className="p-4 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg text-left transition-colors disabled:opacity-50"
            >
              <div className="flex items-center space-x-3">
                <IconMap icon={preset.icon} size={24} />
                <div>
                  <div className="font-bold text-sm uppercase tracking-wider">
                    {preset.name}
                  </div>
                  <div className="text-xs text-tasty-white/70 mt-1">
                    {preset.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Custom Prompt */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => setShowCustomPrompt(!showCustomPrompt)}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: 'rgb(31, 41, 55)',
              border: '1px solid rgb(75, 85, 99)',
              borderRadius: '8px',
              textAlign: 'left',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontSize: '14px',
              color: 'var(--color-tasty-white)',
              cursor: 'pointer',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(55, 65, 81)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(31, 41, 55)'}
          >
            {showCustomPrompt ? '✕ HIDE CUSTOM PROMPT' : '+ CUSTOM PROMPT'}
          </button>

          {showCustomPrompt && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe how you want to edit your photo... (e.g., 'Make the lighting warmer and more golden', 'Convert to black and white', 'Add dramatic shadows')"
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'rgb(17, 24, 39)',
                  border: '1px solid rgb(55, 65, 81)',
                  borderRadius: '8px',
                  color: 'var(--color-tasty-white)',
                  fontSize: '14px',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
                rows={4}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-tasty-yellow)'}
                onBlur={(e) => e.target.style.borderColor = 'rgb(55, 65, 81)'}
              />
              <button
                onClick={handleCustomEdit}
                disabled={currentService.isProcessing || !customPrompt.trim() || !selectedModel}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  background: 'var(--gradient-tasty)',
                  color: 'var(--color-tasty-black)',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: currentService.isProcessing || !customPrompt.trim() || !selectedModel ? 'not-allowed' : 'pointer',
                  opacity: currentService.isProcessing || !customPrompt.trim() || !selectedModel ? 0.5 : 1,
                  transition: 'all 0.15s',
                  fontSize: '14px'
                }}
                onMouseEnter={(e) => {
                  if (!currentService.isProcessing && customPrompt.trim() && selectedModel) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {currentService.isProcessing ? 'PROCESSING...' : 'APPLY CUSTOM EDIT'}
              </button>
            </div>
          )}
        </div>

        {/* Upscaling Options */}
        {editedImage && (
          <div style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid rgb(55, 65, 81)'
          }}>
            <h3 style={{
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontSize: '14px',
              color: 'var(--color-tasty-white)',
              marginBottom: '12px'
            }}>
              ENHANCE QUALITY
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              <button
                onClick={() => handleUpscale('x2')}
                disabled={currentService.isProcessing}
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(245, 245, 245, 0.1)',
                  border: '1px solid rgba(245, 245, 245, 0.2)',
                  borderRadius: '8px',
                  color: 'var(--color-tasty-white)',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontSize: '14px',
                  cursor: currentService.isProcessing ? 'not-allowed' : 'pointer',
                  opacity: currentService.isProcessing ? 0.5 : 1,
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => {
                  if (!currentService.isProcessing) {
                    e.currentTarget.style.backgroundColor = 'rgba(245, 245, 245, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(245, 245, 245, 0.1)';
                }}
              >
                UPSCALE 2X
              </button>
              <button
                onClick={() => handleUpscale('x4')}
                disabled={currentService.isProcessing}
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(245, 245, 245, 0.1)',
                  border: '1px solid rgba(245, 245, 245, 0.2)',
                  borderRadius: '8px',
                  color: 'var(--color-tasty-white)',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontSize: '14px',
                  cursor: currentService.isProcessing ? 'not-allowed' : 'pointer',
                  opacity: currentService.isProcessing ? 0.5 : 1,
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => {
                  if (!currentService.isProcessing) {
                    e.currentTarget.style.backgroundColor = 'rgba(245, 245, 245, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(245, 245, 245, 0.1)';
                }}
              >
                UPSCALE 4X
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};