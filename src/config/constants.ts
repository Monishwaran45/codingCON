// Environment driven API gateway URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

// Environment driven WebSocket gateway URL
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_BASE_URL || 'ws://localhost:4000';

// Fixed UX convention for problem difficulty badges
export const DIFFICULTY_COLORS = {
  easy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  hard: 'bg-red-500/15 text-red-400 border-red-500/30',
} as const;

// maps evaluation enum -> styled display text
export const VERDICT_CONFIG = {
  AC: { label: 'ACCEPTED', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40' },
  WA: { label: 'WRONG ANSWER', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/40' },
  TLE: { label: 'TIME LIMIT EXCEEDED', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/40' },
  MLE: { label: 'MEMORY LIMIT EXCEEDED', color: 'text-purple-400', bg: 'bg-purple-500/20 border-purple-500/40' },
  RE: { label: 'RUNTIME ERROR', color: 'text-rose-400', bg: 'bg-rose-500/20 border-rose-500/40' },
  running: { label: 'RUNNING JUDGE', color: 'text-cyan-400', bg: 'bg-cyan-500/20 border-cyan-500/40' },
  pending: { label: 'QUEUED', color: 'text-slate-400', bg: 'bg-slate-800/50 border-slate-700' },
} as const;

// Deliberate UX warning thresholds (in seconds) for contest countdown timers
export const TIMER_WARNING_THRESHOLDS = {
  amber: 900, // Show amber alert under 15 minutes
  red: 300,   // Show flashing red warning under 5 minutes
} as const;

// defines rank title thresholds (Codeforces-style classification system)
export const RATING_BANDS = [
  { threshold: 2100, label: 'Master' },
  { threshold: 1900, label: 'Candidate Master' },
  { threshold: 1600, label: 'Expert' },
  { threshold: 1400, label: 'Specialist' },
  { threshold: 1200, label: 'Pupil' },
  { threshold: 0, label: 'Newbie' },
] as const;

// Bare minimal competitive programming starter boilerplate per language
export const LANGUAGE_STARTERS: Record<string, string> = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    return 0;
}
`,
  python: `import sys

def solve():
    pass

if __name__ == '__main__':
    solve()
`,
  javascript: `const fs = require('fs');

function main() {
    const input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);
    if (!input || input[0] === '') return;
}

main();
`,
  java: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
    }
}
`
};
