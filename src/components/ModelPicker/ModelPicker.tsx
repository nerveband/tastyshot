import React, { useState } from 'react';
import { IconMap } from '../UI/IconMap';
import { Edit3, Bot, Search, X } from 'lucide-react';
import type { AIModel } from '../../types';

interface ModelPickerProps {
  availableModels: AIModel[];
  selectedModel: AIModel;
  onModelSelect: (model: AIModel) => void;
  onClose: () => void;
}

export const ModelPicker: React.FC<ModelPickerProps> = ({
  availableModels,
  selectedModel,
  onModelSelect,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'image-editing', 'image-generation', 'upscaling'];
  
  const filteredModels = selectedCategory === 'all' 
    ? availableModels 
    : availableModels.filter(model => model.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'image-editing': return <Edit3 size={16} />;
      case 'image-generation': return <Bot size={16} />;
      case 'upscaling': return <Search size={16} />;
      default: return <Bot size={16} />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'all': return 'All Models';
      case 'image-editing': return 'Image Editing';
      case 'image-generation': return 'Image Generation';
      case 'upscaling': return 'Upscaling';
      default: return category;
    }
  };

  return (
    <div className="fixed inset-0 bg-tasty-black/90 flex items-center justify-center p-4 z-50">
      <div className="bg-tasty-black border border-gray-700 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold uppercase tracking-widest text-tasty-white">
            Choose AI Model
          </h2>
          <button
            onClick={onClose}
            className="text-tasty-white hover:text-tasty-yellow transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Category Filter */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors ${
                  selectedCategory === category
                    ? 'bg-tasty-yellow text-tasty-black'
                    : 'bg-gray-800 text-tasty-white hover:bg-gray-700'
                }`}
              >
                <span className="flex items-center space-x-2">
                  {getCategoryIcon(category)}
                  <span>{getCategoryLabel(category)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Models List */}
        <div className="p-4 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {filteredModels.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onModelSelect(model);
                  onClose();
                }}
                className={`w-full p-4 rounded-lg border text-left transition-all ${
                  selectedModel.id === model.id
                    ? 'border-tasty-yellow bg-tasty-yellow/10'
                    : 'border-gray-700 bg-gray-900 hover:border-gray-600 hover:bg-gray-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getCategoryIcon(model.category)}
                      <h3 className="font-bold text-tasty-white uppercase tracking-wider">
                        {model.name}
                      </h3>
                      <span className="px-2 py-1 bg-gray-700 text-xs text-tasty-white/70 rounded uppercase tracking-wider">
                        {model.provider}
                      </span>
                    </div>
                    <p className="text-sm text-tasty-white/70 mb-2">
                      {model.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-tasty-white/50">
                      <span>Cost: {model.cost} credits</span>
                      {model.estimatedTime && (
                        <span>Time: {model.estimatedTime}</span>
                      )}
                      <span>
                        Inputs: {model.supportedInputs.join(', ')}
                      </span>
                    </div>
                  </div>
                  {selectedModel.id === model.id && (
                    <div className="text-tasty-yellow">
                      <IconMap icon="check" size={20} color="#FFD700" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-900/50">
          <p className="text-xs text-tasty-white/50 text-center">
            Select a model that best fits your editing needs. Different models have different strengths and processing times.
          </p>
        </div>
      </div>
    </div>
  );
};