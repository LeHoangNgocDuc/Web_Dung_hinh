
import React, { useState, useRef, useEffect } from 'react';
import { DEFAULT_PALETTE } from '../constants';

interface ColorPickerProps {
  activeColor: string;
  onChange: (color: string) => void;
  recentColors: string[];
}

const ColorPicker: React.FC<ColorPickerProps> = ({ activeColor, onChange, recentColors }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleColorSelect = (color: string) => {
    onChange(color);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-lg shadow-sm border border-gray-300 flex items-center justify-center bg-white hover:bg-gray-50 transition-colors"
        title="Change Color"
      >
        <div 
            className="w-6 h-6 rounded-full border border-gray-200 shadow-inner" 
            style={{ backgroundColor: activeColor }} 
        />
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute top-12 left-0 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-56 animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Default Palette */}
          <div className="mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Standard</span>
            <div className="grid grid-cols-4 gap-2">
              {DEFAULT_PALETTE.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className={`w-8 h-8 rounded-full border border-gray-100 hover:scale-110 transition-transform ${activeColor === color ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Recent Colors */}
          {recentColors.length > 0 && (
            <div className="mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Recent</span>
              <div className="grid grid-cols-4 gap-2">
                {recentColors.map((color, idx) => (
                   // Prevent duplicates in display if they exist in state, though set logic handles it
                   <button
                    key={`${color}-${idx}`}
                    onClick={() => handleColorSelect(color)}
                    className={`w-8 h-8 rounded-full border border-gray-100 hover:scale-110 transition-transform ${activeColor === color ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Custom Input */}
          <div className="pt-2 border-t border-gray-100">
             <div className="flex items-center gap-2">
                <input 
                    type="color" 
                    value={activeColor}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-8 h-8 p-0 border-0 rounded overflow-hidden cursor-pointer"
                />
                <span className="text-xs text-gray-500 font-mono flex-1">{activeColor}</span>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
