import React, { useState, useRef } from 'react';
import { useReplicate } from '../../hooks/useReplicate';
import type { ReplicateModelSettings, UpscaleSettings } from '../../types';

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
  const [comparisonMode, setComparisonMode] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  
  const sliderRef = useRef<HTMLDivElement>(null);

  const {
    isProcessing,
    progress,
    error,
    editImage,
    upscaleImage,
    clearError,
    editingPresets,
  } = useReplicate();

  // Handle preset selection
  const handlePresetEdit = async (preset: any) => {
    clearError();
    const settings: ReplicateModelSettings = {
      prompt: preset.prompt,
      guidance_scale: 5.5, // Good balance for most edits
    };

    const result = await editImage(originalImage, settings, (output) => {
      console.log('Processing progress:', output);
    });

    if (result) {
      setEditedImage(result);
      onEditComplete(result);
    }
  };

  // Handle custom prompt editing
  const handleCustomEdit = async () => {
    if (!customPrompt.trim()) return;
    
    clearError();
    const settings: ReplicateModelSettings = {
      prompt: customPrompt,
      guidance_scale: 5.5,
    };

    const result = await editImage(originalImage, settings);

    if (result) {
      setEditedImage(result);
      onEditComplete(result);
    }
  };

  // Handle image upscaling
  const handleUpscale = async (factor: 'x2' | 'x4') => {
    const imageToUpscale = editedImage || originalImage;
    clearError();
    
    const settings: UpscaleSettings = {
      upscale_factor: factor,
      compression_quality: 80,
    };

    const result = await upscaleImage(imageToUpscale, settings);

    if (result) {
      setEditedImage(result);
      onEditComplete(result);
    }
  };

  // Handle slider drag for comparison
  const handleSliderDrag = (e: React.PointerEvent) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  return (
    <div className="min-h-screen bg-tasty-black text-tasty-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-tasty-white hover:text-tasty-yellow transition-colors"
        >
          <span className="text-xl">←</span>
          <span className="font-bold uppercase tracking-wider">BACK</span>
        </button>
        
        <h1 className="font-bold text-lg uppercase tracking-widest">EDIT PHOTO</h1>
        
        {editedImage && (
          <button
            onClick={() => setComparisonMode(!comparisonMode)}
            className="text-sm font-bold uppercase tracking-wider text-tasty-yellow hover:text-tasty-orange transition-colors"
          >
            {comparisonMode ? 'HIDE' : 'COMPARE'}
          </button>
        )}
      </div>

      {/* Image Display */}
      <div className="relative flex-1 p-4">
        <div className="relative max-w-2xl mx-auto">
          {comparisonMode && editedImage ? (
            // Before/After Comparison
            <div 
              ref={sliderRef}
              className="relative w-full aspect-square bg-gray-900 rounded-lg overflow-hidden cursor-ew-resize"
              onPointerMove={handleSliderDrag}
              onPointerDown={handleSliderDrag}
            >
              {/* Original Image */}
              <img
                src={originalImage}
                alt="Original"
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Edited Image with Clip Path */}
              <div
                className="absolute inset-0 w-full h-full"
                style={{
                  clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
                }}
              >
                <img
                  src={editedImage}
                  alt="Edited"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Slider Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-tasty-yellow pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-tasty-yellow rounded-full border-2 border-tasty-black flex items-center justify-center">
                  <span className="text-tasty-black text-xs">⟷</span>
                </div>
              </div>
              
              {/* Labels */}
              <div className="absolute top-4 left-4 bg-tasty-black/80 px-3 py-1 rounded text-sm font-bold uppercase tracking-wider">
                ORIGINAL
              </div>
              <div className="absolute top-4 right-4 bg-tasty-black/80 px-3 py-1 rounded text-sm font-bold uppercase tracking-wider">
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

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-tasty-black/80 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-tasty-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-tasty-white font-bold uppercase tracking-wider mb-2">
                PROCESSING...
              </p>
              {progress.length > 0 && (
                <p className="text-tasty-white/70 text-sm">
                  {progress[progress.length - 1]}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 mx-4 bg-red-900/50 border border-red-700 rounded-lg mb-4">
          <p className="text-red-200 text-sm">{error}</p>
          <button
            onClick={clearError}
            className="mt-2 text-xs text-red-300 hover:text-red-100"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Editing Presets */}
      <div className="p-4 border-t border-gray-800">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {editingPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetEdit(preset)}
              disabled={isProcessing}
              className="p-4 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg text-left transition-colors disabled:opacity-50"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{preset.icon}</span>
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
        <div className="space-y-3">
          <button
            onClick={() => setShowCustomPrompt(!showCustomPrompt)}
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-left font-bold uppercase tracking-wider text-sm hover:bg-gray-700 transition-colors"
          >
            {showCustomPrompt ? '✕ HIDE CUSTOM PROMPT' : '+ CUSTOM PROMPT'}
          </button>

          {showCustomPrompt && (
            <div className="space-y-3">
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe how you want to edit your photo..."
                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-tasty-white placeholder-tasty-white/50 resize-none"
                rows={3}
              />
              <button
                onClick={handleCustomEdit}
                disabled={isProcessing || !customPrompt.trim()}
                className="btn-primary w-full disabled:opacity-50"
              >
                APPLY CUSTOM EDIT
              </button>
            </div>
          )}
        </div>

        {/* Upscaling Options */}
        {editedImage && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h3 className="font-bold uppercase tracking-wider text-sm mb-3">
              ENHANCE QUALITY
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleUpscale('x2')}
                disabled={isProcessing}
                className="btn-secondary disabled:opacity-50"
              >
                UPSCALE 2X
              </button>
              <button
                onClick={() => handleUpscale('x4')}
                disabled={isProcessing}
                className="btn-secondary disabled:opacity-50"
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