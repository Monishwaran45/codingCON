// Internal DB row shapes (snake_case, matching column names)

export interface UserRow {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: 'student' | 'admin' | 'problem_setter';
  rating: number;
  max_rating: number;
  streak_days: number;
  solved_count: number;
  created_at: string;
}

export interface ProblemRow {
  id: string;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  time_limit_ms: number;
  memory_limit_mb: number;
  acceptance_rate: number;
  total_submissions: number;
  description: string;
  input_format: string;
  output_format: string;
  tags: string; // JSON array string
  is_active: number;
  created_by: string | null;
  created_at: string;
}

export interface TestCaseRow {
  id: string;
  problem_id: string;
  input: string;
  expected_output: string;
  is_sample: number;
  sort_order: number;
}

export interface ContestRow {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  participant_count: number;
  max_score: number;
  is_leaderboard_frozen: number;
  freeze_time_remaining_minutes: number | null;
  created_by: string | null;
  created_at: string;
}

export interface AnnouncementRow {
  id: string;
  contest_id: string;
  message: string;
  created_by: string | null;
  timestamp: string;
}

export interface SubmissionRow {
  id: string;
  problem_id: string;
  user_id: string;
  contest_id: string | null;
  language: string;
  code: string;
  verdict: 'pending' | 'running' | 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE';
  passed_test_cases: number;
  total_test_cases: number;
  execution_time_ms: number;
  memory_kb: number;
  is_submit: number;
  created_at: string;
}

export interface SubmissionResultRow {
  id: string;
  submission_id: string;
  test_case_id: string;
  passed: number;
  actual_output: string | null;
  execution_time_ms: number | null;
  memory_kb: number | null;
  error: string | null;
  sort_order: number;
}

export interface LeaderboardRow {
  contest_id: string;
  user_id: string;
  username: string;
  solved_count: number;
  total_score: number;
  penalty_time_minutes: number;
  problem_breakdown: string; // JSON
  last_updated: string;
}
