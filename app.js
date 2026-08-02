/**
 * codingCON - Frontend Application Logic & Interactive Arena Engine
 * Author: Monishwaran45 (frontend branch)
 */

// --- DATASETS ---

const PROBLEMS = {
    p1: {
        id: "p1",
        title: "A. Subarray XOR Maximum",
        difficulty: "easy",
        points: 500,
        timeLimit: "1.0s",
        memoryLimit: "256MB",
        description: "Given an array of N integers, find the maximum bitwise XOR sum of any contiguous subarray. You must output the maximum value and the minimum length of the subarray achieving this maximum.",
        inputFormat: "The first line contains T (1 <= T <= 100). Each test case consists of N (1 <= N <= 10^5) followed by N space-separated integers.",
        outputFormat: "Print two space-separated integers: the maximum XOR sum and the length of the subarray.",
        sampleInput: "5\n4 1 2 4 8\n1 7\n3 8 2 10",
        sampleOutput: "15 4\n7 1\n10 1",
        templates: {
            javascript: `// Solution for A. Subarray XOR Maximum (JavaScript)
function solve(n, arr) {
    let maxXor = 0;
    let minLen = n;
    
    for (let i = 0; i < n; i++) {
        let currentXor = 0;
        for (let j = i; j < n; j++) {
            currentXor ^= arr[j];
            let len = j - i + 1;
            if (currentXor > maxXor) {
                maxXor = currentXor;
                minLen = len;
            } else if (currentXor === maxXor) {
                minLen = Math.min(minLen, len);
            }
        }
    }
    return \`\${maxXor} \${minLen}\`;
}

// Read sample input
console.log(solve(5, [4, 1, 2, 4, 8]));`,

            python: `# Solution for A. Subarray XOR Maximum (Python)
def solve(n, arr):
    max_xor = 0
    min_len = n
    for i in range(n):
        curr = 0
        for j in range(i, n):
            curr ^= arr[j]
            length = j - i + 1
            if curr > max_xor:
                max_xor = curr
                min_len = length
            elif curr == max_xor:
                min_len = min(min_len, length)
    return f"{max_xor} {min_len}"

print(solve(5, [4, 1, 2, 4, 8]))`,

            cpp: `// Solution for A. Subarray XOR Maximum (C++)
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

void solve() {
    int n;
    cin >> n;
    vector<int> a(n);
    for(int i = 0; i < n; i++) cin >> a[i];
    
    int max_xor = 0, min_len = n;
    for(int i = 0; i < n; i++) {
        int curr = 0;
        for(int j = i; j < n; j++) {
            curr ^= a[j];
            int len = j - i + 1;
            if (curr > max_xor) {
                max_xor = curr;
                min_len = len;
            } else if (curr == max_xor) {
                min_len = min(min_len, len);
            }
        }
    }
    cout << max_xor << " " << min_len << "\\n";
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    solve();
    return 0;
}`,

            java: `// Solution for A. Subarray XOR Maximum (Java)
import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] arr = new int[n];
        for(int i = 0; i < n; i++) arr[i] = sc.nextInt();
        
        int maxXor = 0, minLen = n;
        for(int i = 0; i < n; i++) {
            int curr = 0;
            for(int j = i; j < n; j++) {
                curr ^= arr[j];
                int len = j - i + 1;
                if (curr > maxXor) {
                    maxXor = curr;
                    minLen = len;
                } else if (curr == maxXor) {
                    minLen = Math.min(minLen, len);
                }
            }
        }
        System.out.println(maxXor + " " + minLen);
    }
}`
        }
    },
    p2: {
        id: "p2",
        title: "B. Graph Connectivity Query",
        difficulty: "medium",
        points: 750,
        timeLimit: "2.0s",
        memoryLimit: "512MB",
        description: "You are given an undirected graph with N vertices and M edges. Perform Q queries: each query either adds an edge or asks if vertex U and vertex V are connected in the graph.",
        inputFormat: "First line: N M Q. Followed by M lines of edges. Followed by Q lines of query types (1 u v for add edge, 2 u v for check connection).",
        outputFormat: "For each type 2 query, print YES if connected, otherwise NO.",
        sampleInput: "4 2 3\n1 2\n3 4\n2 1 2\n2 1 4\n1 2 3",
        sampleOutput: "YES\nNO",
        templates: {
            javascript: `// Disjoint Set Union (DSU) Implementation
class DSU {
    constructor(n) {
        this.parent = Array.from({length: n + 1}, (_, i) => i);
    }
    find(i) {
        if (this.parent[i] === i) return i;
        return this.parent[i] = this.find(this.parent[i]);
    }
    union(i, j) {
        let rootI = this.find(i);
        let rootJ = this.find(j);
        if (rootI !== rootJ) this.parent[rootI] = rootJ;
    }
}
console.log("DSU Graph Ready");`,
            python: `class DSU:
    def __init__(self, n):
        self.parent = list(range(n + 1))
    def find(self, i):
        if self.parent[i] == i:
            return i
        self.parent[i] = self.find(self.parent[i])
        return self.parent[i]
    def union(self, i, j):
        root_i, root_j = self.find(i), self.find(j)
        if root_i != root_j:
            self.parent[root_i] = root_j`,
            cpp: `// C++ DSU Template
#include <bits/stdc++.h>
using namespace std;
struct DSU {
    vector<int> parent;
    DSU(int n) { parent.resize(n+1); iota(parent.begin(), parent.end(), 0); }
    int find(int i) { return parent[i] == i ? i : parent[i] = find(parent[i]); }
    void unite(int i, int j) { parent[find(i)] = find(j); }
};`,
            java: `// Java DSU Implementation
class DSU {
    int[] parent;
    public DSU(int n) {
        parent = new int[n + 1];
        for (int i = 0; i <= n; i++) parent[i] = i;
    }
    public int find(int i) {
        if (parent[i] == i) return i;
        return parent[i] = find(parent[i]);
    }
    public void union(int i, int j) {
        int rootI = find(i), rootJ = find(j);
        if (rootI != rootJ) parent[rootI] = rootJ;
    }
}`
        }
    },
    p3: {
        id: "p3",
        title: "C. Matrix Path DP",
        difficulty: "medium",
        points: 1000,
        timeLimit: "1.5s",
        memoryLimit: "256MB",
        description: "Find the path from top-left (0,0) to bottom-right (N-1, M-1) in a grid that minimizes the sum of numbers along the path.",
        inputFormat: "N and M integers on first line, followed by N lines of M integers.",
        outputFormat: "Minimum path sum.",
        sampleInput: "3 3\n1 3 1\n1 5 1\n4 2 1",
        sampleOutput: "7",
        templates: {
            javascript: `// DP Matrix Path Sum
function minPathSum(grid) {
    let m = grid.length, n = grid[0].length;
    let dp = Array.from({length: m}, () => Array(n).fill(0));
    dp[0][0] = grid[0][0];
    for (let i = 1; i < m; i++) dp[i][0] = dp[i-1][0] + grid[i][0];
    for (let j = 1; j < n; j++) dp[0][j] = dp[0][j-1] + grid[0][j];
    for (let i = 1; i < m; i++) {
        for (let j = 1; j < n; j++) {
            dp[i][j] = grid[i][j] + Math.min(dp[i-1][j], dp[i][j-1]);
        }
    }
    return dp[m-1][n-1];
}`,
            python: `def min_path_sum(grid):
    m, n = len(grid), len(grid[0])
    for i in range(1, m): grid[i][0] += grid[i-1][0]
    for j in range(1, n): grid[0][j] += grid[0][j-1]
    for i in range(1, m):
        for j in range(1, n):
            grid[i][j] += min(grid[i-1][j], grid[i][j-1])
    return grid[-1][-1]`,
            cpp: `// C++ Grid DP
int minPathSum(vector<vector<int>>& grid) {
    int m = grid.size(), n = grid[0].size();
    for (int i = 1; i < m; i++) grid[i][0] += grid[i-1][0];
    for (int j = 1; j < n; j++) grid[0][j] += grid[0][j-1];
    for (int i = 1; i < m; i++)
        for (int j = 1; j < n; j++)
            grid[i][j] += min(grid[i-1][j], grid[i][j-1]);
    return grid[m-1][n-1];
}`,
            java: `public int minPathSum(int[][] grid) {
    int m = grid.length, n = grid[0].length;
    for (int i = 1; i < m; i++) grid[i][0] += grid[i-1][0];
    for (int j = 1; j < n; j++) grid[0][j] += grid[0][j-1];
    for (int i = 1; i < m; i++) {
        for (int j = 1; j < n; j++) {
            grid[i][j] += Math.min(grid[i-1][j], grid[i][j-1]);
        }
    }
    return grid[m-1][n-1];
}`
        }
    },
    p4: {
        id: "p4",
        title: "D. Quantum Segment Tree",
        difficulty: "hard",
        points: 1250,
        timeLimit: "3.0s",
        memoryLimit: "512MB",
        description: "Maintain an array supporting range bitwise OR updates and range gcd queries online in O(log N).",
        inputFormat: "N and Q on first line. N integers. Q query lines.",
        outputFormat: "Results for type 2 range queries.",
        sampleInput: "5 3\n2 4 6 8 10\n2 1 3\n1 2 4 3\n2 1 3",
        sampleOutput: "2\n1",
        templates: {
            javascript: `// Segment Tree with Lazy Propagation Template
console.log("Segment Tree Skeleton");`,
            python: `# Segment Tree Python Solution
print("Segment Tree Template")`,
            cpp: `// C++ Segment Tree
#include <iostream>
using namespace std;
int main() { cout << "Ready\\n"; }`,
            java: `public class Solution {
    public static void main(String[] args) {
        System.out.println("Ready");
    }
}`
        }
    }
};

// Initial Leaderboard State
const LEADERBOARD_DATA = [
    { rank: 1, handle: "tourist", solved: 4, score: 2500, penalty: "00:42:10", breakdown: ["500", "750", "1000", "1250"] },
    { rank: 2, handle: "Benq", solved: 4, score: 2420, penalty: "01:05:45", breakdown: ["500", "750", "1000", "1170"] },
    { rank: 3, handle: "Monishwaran45", solved: 3, score: 2250, penalty: "00:58:12", breakdown: ["500", "750", "1000", "-"] },
    { rank: 4, handle: "Radewoosh", solved: 3, score: 2100, penalty: "01:12:30", breakdown: ["500", "750", "850", "-"] },
    { rank: 5, handle: "ecnerwala", solved: 2, score: 1250, penalty: "00:35:10", breakdown: ["500", "750", "-", "-"] },
    { rank: 6, handle: "Um_nik", solved: 2, score: 1250, penalty: "00:48:55", breakdown: ["500", "750", "-", "-"] }
];

// Initial Submissions History
const SUBMISSIONS_DATA = [
    { id: "S89124", user: "Monishwaran45", prob: "C. Matrix Path DP", lang: "JavaScript", status: "ACCEPTED", time: "18 ms", timestamp: "5 mins ago" },
    { id: "S89110", user: "Monishwaran45", prob: "B. Graph Connectivity", lang: "JavaScript", status: "ACCEPTED", time: "42 ms", timestamp: "18 mins ago" },
    { id: "S89098", user: "tourist", prob: "D. Quantum Segment Tree", lang: "C++ 20", status: "ACCEPTED", time: "12 ms", timestamp: "25 mins ago" },
    { id: "S89085", user: "Monishwaran45", prob: "A. Subarray XOR Max", lang: "JavaScript", status: "ACCEPTED", time: "24 ms", timestamp: "32 mins ago" },
    { id: "S89071", user: "Radewoosh", prob: "C. Matrix Path DP", lang: "C++ 20", status: "WRONG_ANSWER", time: "15 ms", timestamp: "40 mins ago" }
];

// --- APP STATE & LOGIC ---

let currentProblemId = "p1";
let currentLanguage = "javascript";

document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    initProblemSelector();
    initEditorControls();
    renderProblemDetails(currentProblemId);
    renderLeaderboard(LEADERBOARD_DATA);
    renderSubmissions(SUBMISSIONS_DATA);
    startTimerCountdown();
});

// Navigation Tabs Handler
function initNavigation() {
    const navButtons = document.querySelectorAll(".nav-btn");
    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            navButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            const targetTab = btn.getAttribute("data-tab");
            document.querySelectorAll(".tab-content").forEach(tab => {
                tab.classList.remove("active");
            });
            document.getElementById(`tab-${targetTab}`).classList.add("active");
        });
    });
}

// Problem Selector Handler
function initProblemSelector() {
    const probButtons = document.querySelectorAll(".prob-btn");
    probButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            probButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            currentProblemId = btn.getAttribute("data-prob-id");
            renderProblemDetails(currentProblemId);
        });
    });
}

// Render Selected Problem Details
function renderProblemDetails(probId) {
    const prob = PROBLEMS[probId];
    if (!prob) return;

    document.getElementById("problem-title").textContent = prob.title;
    document.getElementById("problem-desc-text").textContent = prob.description;
    document.getElementById("problem-input-fmt").textContent = prob.inputFormat;
    document.getElementById("problem-output-fmt").textContent = prob.outputFormat;
    document.getElementById("sample-input-1").textContent = prob.sampleInput;
    document.getElementById("sample-output-1").textContent = prob.sampleOutput;
    
    // Set Difficulty Badge
    const diffBadge = document.getElementById("problem-difficulty");
    diffBadge.textContent = prob.difficulty.toUpperCase();
    diffBadge.className = `difficulty-badge ${prob.difficulty}`;

    // Load initial code template for selected language
    loadCodeTemplate();
}

// Editor Controls & Execution Console
function initEditorControls() {
    const langSelect = document.getElementById("lang-select");
    const codeInput = document.getElementById("code-input");
    const resetBtn = document.getElementById("reset-code-btn");
    const runBtn = document.getElementById("run-code-btn");
    const submitBtn = document.getElementById("submit-code-btn");

    langSelect.addEventListener("change", (e) => {
        currentLanguage = e.target.value;
        loadCodeTemplate();
    });

    codeInput.addEventListener("input", updateLineNumbers);

    resetBtn.addEventListener("click", () => {
        loadCodeTemplate();
    });

    runBtn.addEventListener("click", () => {
        executeSolution(false);
    });

    submitBtn.addEventListener("click", () => {
        executeSolution(true);
    });
}

function loadCodeTemplate() {
    const prob = PROBLEMS[currentProblemId];
    const codeInput = document.getElementById("code-input");
    const template = prob.templates[currentLanguage] || "// Write your code here...";
    codeInput.value = template;
    updateLineNumbers();
}

function updateLineNumbers() {
    const codeInput = document.getElementById("code-input");
    const lineNumbers = document.getElementById("line-numbers");
    const linesCount = codeInput.value.split("\n").length;
    lineNumbers.innerHTML = Array.from({length: linesCount}, (_, i) => i + 1).join("<br>");
}

// Execute Solution Simulator
function executeSolution(isSubmission) {
    const verdictStatus = document.getElementById("verdict-status");
    const consolePlaceholder = document.getElementById("console-placeholder");
    const consoleResults = document.getElementById("console-results");
    const verdictBanner = document.getElementById("verdict-banner");
    const verdictText = document.getElementById("verdict-text");
    const verdictMetrics = document.getElementById("verdict-metrics");
    const testcasesList = document.getElementById("testcases-list");

    verdictStatus.textContent = "Compiling & Running...";
    verdictStatus.className = "verdict-status status-running";
    consolePlaceholder.style.display = "block";
    consoleResults.classList.add("hidden");

    setTimeout(() => {
        consolePlaceholder.style.display = "none";
        consoleResults.classList.remove("hidden");

        const codeContent = document.getElementById("code-input").value;
        const isPassed = codeContent.trim().length > 30 && !codeContent.includes("error");

        if (isPassed) {
            verdictStatus.textContent = "Accepted";
            verdictStatus.className = "verdict-status status-accepted";

            verdictBanner.className = "verdict-banner";
            document.getElementById("verdict-icon").textContent = "✓";
            verdictText.textContent = isSubmission ? "ALL TEST CASES PASSED (10/10)" : "SAMPLE TEST CASES PASSED (2/2)";
            verdictMetrics.textContent = "Runtime: 28 ms | Memory: 14.8 MB";

            testcasesList.innerHTML = `
                <div class="testcase-item"><span>Test Case #1 (Sample):</span><span style="color: var(--success)">PASSED (12ms)</span></div>
                <div class="testcase-item"><span>Test Case #2 (Sample):</span><span style="color: var(--success)">PASSED (16ms)</span></div>
                ${isSubmission ? `
                <div class="testcase-item"><span>Test Case #3 (Hidden):</span><span style="color: var(--success)">PASSED (18ms)</span></div>
                <div class="testcase-item"><span>Test Case #4 (Hidden):</span><span style="color: var(--success)">PASSED (28ms)</span></div>
                ` : ''}
            `;

            if (isSubmission) {
                // Add to Submissions log
                const newSub = {
                    id: `S${Math.floor(89200 + Math.random() * 100)}`,
                    user: "Monishwaran45",
                    prob: PROBLEMS[currentProblemId].title,
                    lang: getLangDisplayName(currentLanguage),
                    status: "ACCEPTED",
                    time: "28 ms",
                    timestamp: "Just now"
                };
                SUBMISSIONS_DATA.unshift(newSub);
                renderSubmissions(SUBMISSIONS_DATA);
            }
        } else {
            verdictStatus.textContent = "Wrong Answer";
            verdictStatus.className = "verdict-status status-wrong";

            verdictBanner.className = "verdict-banner error-banner";
            document.getElementById("verdict-icon").textContent = "✗";
            verdictText.textContent = "WRONG ANSWER ON TEST CASE 1";
            verdictMetrics.textContent = "Runtime: 14 ms | Output mismatch on line 1";

            testcasesList.innerHTML = `
                <div class="testcase-item"><span>Test Case #1:</span><span style="color: var(--danger)">FAILED (Expected '15 4', Got '0 0')</span></div>
            `;
        }
    }, 1000);
}

function getLangDisplayName(langKey) {
    const map = { javascript: "JavaScript", python: "Python 3", cpp: "C++ 20", java: "Java 17" };
    return map[langKey] || langKey;
}

// Render Leaderboard Table
function renderLeaderboard(data) {
    const tbody = document.getElementById("leaderboard-body");
    const searchInput = document.getElementById("leaderboard-search");
    
    const filterAndRender = () => {
        const query = searchInput ? searchInput.value.toLowerCase() : "";
        const filtered = data.filter(row => row.handle.toLowerCase().includes(query));

        tbody.innerHTML = filtered.map(row => {
            const rankClass = row.rank <= 3 ? `rank-${row.rank}` : 'rank-normal';
            return `
                <tr>
                    <td><span class="rank-pill ${rankClass}">${row.rank}</span></td>
                    <td>
                        <div class="user-cell">
                            <div class="avatar">${row.handle[0].toUpperCase()}</div>
                            <span>${row.handle}</span>
                        </div>
                    </td>
                    <td><strong>${row.solved}</strong></td>
                    <td style="color: var(--primary); font-weight:700">${row.score} pts</td>
                    <td style="font-family: 'Fira Code', monospace">${row.penalty}</td>
                    <td>${row.breakdown.map(b => `<span class="meta-tag">${b}</span>`).join(' ')}</td>
                </tr>
            `;
        }).join('');
    };

    if (searchInput) searchInput.addEventListener("input", filterAndRender);
    filterAndRender();
}

// Render Submissions Table
function renderSubmissions(data) {
    const tbody = document.getElementById("submissions-body");
    tbody.innerHTML = data.map(sub => {
        let statusClass = "accepted";
        if (sub.status === "WRONG_ANSWER") statusClass = "wrong";
        if (sub.status === "TIME_LIMIT_EXCEEDED") statusClass = "tle";

        return `
            <tr>
                <td style="font-family: 'Fira Code', monospace; font-size: 0.82rem">${sub.id}</td>
                <td><strong>${sub.user}</strong></td>
                <td>${sub.prob}</td>
                <td><span class="meta-tag">${sub.lang}</span></td>
                <td><span class="verdict-tag ${statusClass}">${sub.status}</span></td>
                <td style="font-family: 'Fira Code', monospace">${sub.time}</td>
                <td style="color: var(--text-muted); font-size: 0.82rem">${sub.timestamp}</td>
            </tr>
        `;
    }).join('');
}

// Helper Copy Function
function copyText(elementId) {
    const text = document.getElementById(elementId).textContent;
    navigator.clipboard.writeText(text).then(() => {
        alert("Copied sample test case to clipboard!");
    });
}

// Contest Countdown Timer Tick
function startTimerCountdown() {
    let secondsLeft = 6138; // ~1h 42m 18s
    const timerClock = document.getElementById("timer-clock");
    
    setInterval(() => {
        if (secondsLeft > 0) secondsLeft--;
        const hrs = String(Math.floor(secondsLeft / 3600)).padStart(2, '0');
        const mins = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0');
        const secs = String(secondsLeft % 60).padStart(2, '0');
        if (timerClock) timerClock.textContent = `${hrs}:${mins}:${secs}`;
    }, 1000);
}
