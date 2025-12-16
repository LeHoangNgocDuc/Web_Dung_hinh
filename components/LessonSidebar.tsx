
import React, { useState } from 'react';
import { CURRICULUM } from '../constants';
import { Lesson } from '../types';

interface LessonSidebarProps {
  onSelectLesson: (lesson: Lesson) => void;
  activeLessonId: string | null;
}

const LessonSidebar: React.FC<LessonSidebarProps> = ({ onSelectLesson, activeLessonId }) => {
  const [expandedGrade, setExpandedGrade] = useState<string>('grade_9');

  // Auto expand Grade based on active lesson
  React.useEffect(() => {
    if (activeLessonId?.startsWith('g6')) setExpandedGrade('grade_6');
    if (activeLessonId?.startsWith('g7')) setExpandedGrade('grade_7');
    if (activeLessonId?.startsWith('g8')) setExpandedGrade('grade_8');
    if (activeLessonId?.startsWith('g9')) setExpandedGrade('grade_9');
  }, [activeLessonId]);

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col shadow-lg z-20">
      <div className="p-4 border-b border-gray-100">
        <h2 className="font-bold text-lg text-blue-900 flex items-center gap-2">
            <span>📐</span> Geometry Master
        </h2>
        <p className="text-xs text-gray-500 mt-1">Chương trình giáo dục phổ thông</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {CURRICULUM.map((section) => (
          <div key={section.id} className="mb-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
              {section.title}
            </h3>
            
            {section.grades.map((grade) => (
              <div key={grade.id} className="mb-2">
                <button
                  onClick={() => setExpandedGrade(expandedGrade === grade.id ? '' : grade.id)}
                  className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded transition-colors"
                >
                  <span>{grade.title}</span>
                  <span className={`transform transition-transform ${expandedGrade === grade.id ? 'rotate-90' : ''}`}>
                    ▸
                  </span>
                </button>

                {expandedGrade === grade.id && (
                  <div className="ml-2 mt-1 space-y-1 border-l-2 border-gray-100 pl-2">
                    {grade.lessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        onClick={() => onSelectLesson(lesson)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-all ${
                          activeLessonId === lesson.id
                            ? 'bg-blue-100 text-blue-700 font-medium shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        {lesson.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        <p>Chọn bài học để bắt đầu thực hành.</p>
      </div>
    </div>
  );
};

export default LessonSidebar;
