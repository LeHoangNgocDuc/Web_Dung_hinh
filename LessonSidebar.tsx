
import React, { useState } from 'react';
import { ToolType } from './types';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  toolId: string; // The tool required for this lesson
}

interface LessonSidebarProps {
  onSelectLesson: (lesson: Lesson) => void;
  activeLessonId: string | null;
  currentTool: ToolType;
  setTool: (t: ToolType) => void;
}

const CURRICULUM = [
  {
    id: 'basic_geo',
    title: 'Hình học cơ bản',
    grades: [
      {
        id: 'grade_6',
        title: 'Lớp 6',
        lessons: [
          {
            id: 'g6_l1_segment',
            title: 'Bài 1: Vẽ đoạn thẳng bất kỳ',
            description: 'Vẽ đoạn thẳng đi qua hai điểm A và B tùy ý.',
            toolId: 'LINE'
          },
          {
            id: 'g6_l2_fixed_segment',
            title: 'Bài 2: Vẽ đoạn thẳng có độ dài',
            description: 'Vẽ đoạn thẳng AB có độ dài bằng số cm cho trước.',
            toolId: 'FIXED_LENGTH_LINE'
          },
          {
            id: 'g6_l3_ray',
            title: 'Bài 3: Vẽ tia',
            description: 'Vẽ tia Ox đi qua điểm O và A.',
            toolId: 'RAY' 
          },
          {
            id: 'g6_l4_inf_line',
            title: 'Bài 4: Vẽ đường thẳng',
            description: 'Vẽ đường thẳng đi qua hai điểm A và B.',
            toolId: 'INFINITE_LINE'
          },
          {
            id: 'g6_l5_measure_angle',
            title: 'Bài 5: Đo góc',
            description: 'Sử dụng thước đo độ để đo góc xOy.',
            toolId: 'MEASURE_ANGLE'
          },
          {
            id: 'g6_l6_draw_angle',
            title: 'Bài 6: Vẽ góc cho trước',
            description: 'Vẽ góc xOy có số đo bằng độ cho trước.',
            toolId: 'DRAW_ANGLE'
          }
        ]
      },
      {
        id: 'grade_7',
        title: 'Lớp 7',
        lessons: [
          {
            id: 'g7_l1_perp_bisector',
            title: 'Bài 1: Dựng Đường Trung Trực',
            description: 'Dựng đường trung trực của đoạn thẳng AB dùng thước và compa.',
            toolId: 'PERPENDICULAR_BISECTOR'
          },
          {
            id: 'g7_l2_midpoint',
            title: 'Bài 2: Dựng Trung Điểm',
            description: 'Dựng trung điểm M của đoạn thẳng AB.',
            toolId: 'MIDPOINT'
          },
          {
            id: 'g7_l3_angle_bisector',
            title: 'Bài 3: Dựng Phân Giác Góc',
            description: 'Dựng tia phân giác của góc xOy dùng thước và compa.',
            toolId: 'ANGLE_BISECTOR'
          },
          {
             id: 'g7_l4_isosceles',
             title: 'Bài 4: Dựng Tam Giác Cân',
             description: 'Dựng tam giác ABC cân tại A.',
             toolId: 'ISOSCELES_TRIANGLE'
          },
          {
            id: 'g7_l5_equilateral',
            title: 'Bài 5: Dựng Tam Giác Đều',
            description: 'Dựng tam giác đều ABC (3 cạnh bằng nhau) dùng thước và compa.',
            toolId: 'EQUILATERAL_TRIANGLE'
          },
          {
            id: 'g7_l6_right_triangle',
            title: 'Bài 6: Dựng Tam Giác Vuông',
            description: 'Dựng tam giác vuông tại A bằng thước và compa.',
            toolId: 'RIGHT_TRIANGLE'
          },
          {
            id: 'g7_l7_perp_eke',
            title: 'Bài 7: Dựng Đường Vuông Góc (Ê-ke)',
            description: 'Dùng ê-ke để kẻ đường thẳng đi qua M và vuông góc với d.',
            toolId: 'PERPENDICULAR_EKE'
          },
          {
            id: 'g7_l8_parallel_sliding',
            title: 'Bài 8: Dựng Đường Song Song',
            description: 'Kỹ thuật trượt 2 thước để vẽ đường song song.',
            toolId: 'PARALLEL_SLIDING'
          }
        ]
      },
      {
        id: 'grade_8',
        title: 'Lớp 8',
        lessons: [
          {
            id: 'g8_l1_quadrilateral',
            title: 'Bài 1: Tứ giác',
            description: 'Vẽ tứ giác ABCD và quan sát tổng các góc bằng 360 độ.',
            toolId: 'QUADRILATERAL'
          },
          {
            id: 'g8_l2_parallelogram',
            title: 'Bài 2: Dựng Hình Bình Hành',
            description: 'Dựng hình bình hành ABCD khi biết 3 đỉnh A, B, C.',
            toolId: 'PARALLELOGRAM'
          }
        ]
      },
      {
        id: 'grade_9',
        title: 'Lớp 9',
        lessons: [
          {
            id: 'g9_l1_tangent',
            title: 'Bài 1: Dựng Tiếp Tuyến',
            description: 'Dựng tiếp tuyến của đường tròn (O) đi qua điểm M nằm ngoài.',
            toolId: 'TANGENT_FROM_POINT'
          }
        ]
      }
    ]
  }
];

const GENERAL_TOOLS = [
  { id: ToolType.SELECT, label: 'Di chuyển', icon: '🖱️' }, // Move tool (Select)
  { id: ToolType.POINT, label: 'Điểm', icon: '⚫' },
  { id: ToolType.LINE, label: 'Đoạn thẳng', icon: '📏' },
  { id: ToolType.PERPENDICULAR, label: 'Vuông góc', icon: '⊥' },
  { id: ToolType.PARALLEL, label: 'Song song', icon: '//' },
  { id: ToolType.CIRCLE, label: 'Compa', icon: '⭕' },
];

const LessonSidebar: React.FC<LessonSidebarProps> = ({ onSelectLesson, activeLessonId, currentTool, setTool }) => {
  const [expandedGrade, setExpandedGrade] = useState<string>('grade_9');
  const [expandedTools, setExpandedTools] = useState<boolean>(true); // Tools expanded by default

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

      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200">
        {/* Curriculum Sections */}
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

        {/* TOOLS SECTION - Placed after curriculum */}
        <div className="mb-4 border-t border-gray-100 pt-4">
            <button
                onClick={() => setExpandedTools(!expandedTools)}
                className="w-full flex items-center justify-between px-2 py-2 text-sm font-bold text-blue-800 hover:bg-blue-50 rounded transition-colors uppercase tracking-wide"
            >
                <span>🛠️ Công cụ</span>
                <span className={`transform transition-transform ${expandedTools ? 'rotate-90' : ''}`}>
                ▸
                </span>
            </button>

            {expandedTools && (
                <div className="grid grid-cols-3 gap-2 p-2 bg-gray-50 rounded-lg mt-2">
                    {GENERAL_TOOLS.map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => setTool(tool.id)}
                            className={`flex flex-col items-center justify-center p-2 rounded-md text-xs transition-all ${
                                currentTool === tool.id
                                    ? 'bg-white shadow text-blue-600 border border-blue-200'
                                    : 'text-gray-600 hover:bg-gray-200'
                            }`}
                            title={tool.label}
                        >
                            <span className="text-xl mb-1">{tool.icon}</span>
                            <span className="text-[10px] text-center leading-tight">{tool.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        <p>Chọn bài học để bắt đầu thực hành.</p>
      </div>
    </div>
  );
};

export default LessonSidebar;
