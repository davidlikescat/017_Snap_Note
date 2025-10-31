-- Seed data for testing
INSERT INTO public.memos (summary, tags, context, insight, original_text, language) VALUES
(
    'Started brainstorming ideas for a new AI-powered memo app',
    ARRAY['#idea', '#brainstorm', '#project'],
    'Idea',
    'Consider integrating voice recording for faster input',
    'I was thinking about creating an app that helps me organize my thoughts better. Maybe something with AI that can automatically categorize my notes.',
    'en'
),
(
    'Meeting with team about Q1 goals and objectives',
    ARRAY['#work', '#meeting', '#planning'],
    'Work Memo',
    'Schedule follow-up meeting to review progress',
    'Had a great meeting today discussing our Q1 objectives. Need to focus on customer retention and new feature development.',
    'en'
),
(
    'Reflecting on personal growth over the past year',
    ARRAY['#reflection', '#growth', '#gratitude'],
    'Personal Reflection',
    'Continue journaling practice to track progress',
    'Looking back at this year, I realize how much I have grown both personally and professionally. Grateful for all the challenges that helped me develop.',
    'en'
),
(
    'AI 기반 메모 앱에 대한 아이디어 구상',
    ARRAY['#아이디어', '#기획', '#프로젝트'],
    'Idea',
    '음성 인식 기능을 추가하면 더 빠른 입력이 가능할 것',
    '생각을 더 잘 정리할 수 있는 앱을 만들면 좋겠다는 생각이 들었어요. AI가 자동으로 노트를 분류해주는 기능이 있으면 좋을 것 같아요.',
    'ko'
),
(
    '팀과의 1분기 목표 회의',
    ARRAY['#업무', '#회의', '#계획'],
    'Work Memo',
    '진행 상황 검토를 위한 후속 회의 일정 잡기',
    '오늘 1분기 목표에 대해 논의하는 좋은 회의를 했습니다. 고객 유지와 새로운 기능 개발에 집중해야 합니다.',
    'ko'
);

-- Verify the data
SELECT
    id,
    substring(summary, 1, 50) as summary_preview,
    tags,
    context,
    language,
    created_at
FROM public.memos
ORDER BY created_at DESC;
