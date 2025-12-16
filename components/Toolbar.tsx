import React from 'react';
import { ToolType } from '../types';

interface ToolbarProps {
  currentTool: ToolType;
  setTool: (t: ToolType) => void;
}

const tools = [
  { id: ToolType.SELECT, label: 'Cursor', icon: 'Pointer' },
  { id: ToolType.POINT, label: 'Point', icon: 'Dot' },
  { id: ToolType.LINE, label: 'Line', icon: 'Line' },
  { id: ToolType.PERPENDICULAR, label: 'Perpendicular', icon: '⊥' },
  { id: ToolType.PARALLEL, label: 'Parallel', icon: '//' },
  { id: ToolType.CIRCLE, label: 'Compass', icon: '○' },
];

const Toolbar: React.FC<ToolbarProps> = ({ currentTool, setTool }) => {
  return (
    <div className="absolute left-4 top-4 bg-white shadow-xl rounded-lg flex flex-col p-2 space-y-2 z-10 border border-gray-200">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => setTool(tool.id)}
          className={`w-12 h-12 flex items-center justify-center rounded-md transition-all duration-200 ${
            currentTool === tool.id
              ? 'bg-blue-600 text-white shadow-inner'
              : 'bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
          }`}
          title={tool.label}
        >
          <span className="font-bold text-lg">{tool.icon}</span>
        </button>
      ))}
    </div>
  );
};

export default Toolbar;
