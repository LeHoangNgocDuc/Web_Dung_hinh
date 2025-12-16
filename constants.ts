
export const SNAP_THRESHOLD = 15; // pixels
export const COLOR_PRIMARY = '#3b82f6'; // blue-500
export const COLOR_HIGHLIGHT = '#06b6d4'; // cyan-500
export const COLOR_SNAP = '#ec4899'; // pink-500

export const STAGE_WIDTH = window.innerWidth;
export const STAGE_HEIGHT = window.innerHeight;

export const PIXELS_PER_CM = 40; // Standard for this app's scale

export const DEFAULT_PALETTE = [
  '#000000', // Black
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#22c55e', // Green
  '#f59e0b', // Amber/Orange
  '#a855f7', // Purple
  '#64748b', // Slate
  '#ec4899', // Pink
];

// Curriculum Configuration
export const CURRICULUM = [
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
