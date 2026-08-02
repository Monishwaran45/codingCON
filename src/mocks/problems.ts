import { Problem } from '@/types';

export const MOCK_PROBLEMS: Problem[] = [
  {
    id: 'p1',
    title: 'Subarray XOR Maximum',
    slug: 'subarray-xor-maximum',
    difficulty: 'easy',
    points: 500,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    acceptanceRate: 74.2,
    totalSubmissions: 3420,
    isSolved: true,
    isAttempted: true,
    lastAttemptedAt: new Date(Date.now() - 3600000).toISOString(),
    tags: ['Bit Manipulation', 'Arrays', 'Prefix XOR'],
    description: `Given an array of $N$ integers, find the maximum bitwise XOR sum of any contiguous subarray. You must output the maximum value and the minimum length of the subarray achieving this maximum value.

Subarray XOR sum is defined as $A[i] \\oplus A[i+1] \\oplus \\dots \\oplus A[j]$ for indices $0 \\le i \\le j < N$.`,
    inputFormat: `The first line contains an integer $T$ ($1 \\le T \\le 100$) — the number of test cases.
Each test case consists of $N$ ($1 \\le N \\le 10^5$) followed by $N$ space-separated integers $A_1, A_2, \\dots, A_N$.`,
    outputFormat: `For each testcase, output two space-separated integers: the maximum XOR sum and the length of the shortest subarray achieving it.`,
    sampleTestCases: [
      {
        id: 1,
        input: `4\n1 2 4 8`,
        expectedOutput: `8 1`,
        isSample: true,
      },
      {
        id: 2,
        input: `3\n8 2 10`,
        expectedOutput: `10 1`,
        isSample: true,
      },
      {
        id: 3,
        input: `5\n1 7 3 8 2`,
        expectedOutput: `14 4`,
        isSample: false,
      }
    ],
  },
  {
    id: 'p2',
    title: 'Graph Connectivity & Dynamic Queries',
    slug: 'graph-connectivity-queries',
    difficulty: 'medium',
    points: 750,
    timeLimitMs: 2000,
    memoryLimitMb: 512,
    acceptanceRate: 48.6,
    totalSubmissions: 1890,
    isSolved: false,
    isAttempted: true,
    lastAttemptedAt: new Date(Date.now() - 86400000).toISOString(),
    tags: ['Graphs', 'Disjoint Set Union', 'Trees'],
    description: `You are given an undirected graph with $N$ vertices and $M$ edges. You need to process $Q$ dynamic queries:
- **Type 1 (1 u v)**: Add an undirected edge between vertex $u$ and vertex $v$.
- **Type 2 (2 u v)**: Determine if vertex $u$ and vertex $v$ belong to the same connected component.

Process all queries online in $O(Q \\cdot \\alpha(N))$ time.`,
    inputFormat: `First line contains $N, M, Q$ ($1 \\le N, Q \\le 2 \\cdot 10^5, 0 \\le M \\le 2 \\cdot 10^5$).
Following $M$ lines describe initial edges.
Following $Q$ lines describe query type and vertex pair.`,
    outputFormat: `For each Type 2 query, print YES if vertices are connected, otherwise print NO.`,
    sampleTestCases: [
      {
        id: 1,
        input: `4 2 3\n1 2\n3 4\n2 1 2\n2 1 4\n1 2 3`,
        expectedOutput: `YES\nNO`,
        isSample: true,
      }
    ],
  },
  {
    id: 'p3',
    title: 'Matrix Minimum Path Sum',
    slug: 'matrix-path-dp',
    difficulty: 'medium',
    points: 1000,
    timeLimitMs: 1500,
    memoryLimitMb: 256,
    acceptanceRate: 58.1,
    totalSubmissions: 2750,
    isSolved: false,
    isAttempted: false,
    tags: ['Dynamic Programming', 'Matrix', 'Grid'],
    description: `Given a $N \\times M$ grid filled with non-negative numbers, find a path from top-left $(0,0)$ to bottom-right $(N-1, M-1)$ which minimizes the sum of all numbers along its path.

You can only move either down or right at any point in time.`,
    inputFormat: `First line contains $N, M$ ($1 \\le N, M \\le 1000$).
Next $N$ lines contain $M$ space-separated integers representing the matrix elements $A_{i,j}$ ($0 \\le A_{i,j} \\le 1000$).`,
    outputFormat: `Print a single integer representing the minimum path sum.`,
    sampleTestCases: [
      {
        id: 1,
        input: `3 3\n1 3 1\n1 5 1\n4 2 1`,
        expectedOutput: `7`,
        isSample: true,
      }
    ],
  },
  {
    id: 'p4',
    title: 'Quantum Segment Tree & Bitwise Range GCD',
    slug: 'quantum-segment-tree',
    difficulty: 'hard',
    points: 1250,
    timeLimitMs: 3000,
    memoryLimitMb: 512,
    acceptanceRate: 22.4,
    totalSubmissions: 890,
    isSolved: false,
    isAttempted: false,
    tags: ['Segment Tree', 'Lazy Propagation', 'Number Theory', 'Hard'],
    description: `Maintain an array of $N$ positive integers under range bitwise OR updates and range greatest common divisor (GCD) queries.

- **Update (1 L R X)**: For all $L \\le i \\le R$, replace $A[i]$ with $A[i] \\mid X$.
- **Query (2 L R)**: Calculate $\\gcd(A[L], A[L+1], \\dots, A[R])$.`,
    inputFormat: `First line contains $N, Q$ ($1 \\le N, Q \\le 10^5$).
Second line contains $N$ space-separated integers $A_1, A_2, \\dots, A_N$.
Next $Q$ lines contain the queries.`,
    outputFormat: `Output the result for each Type 2 range GCD query.`,
    sampleTestCases: [
      {
        id: 1,
        input: `5 3\n2 4 6 8 10\n2 1 3\n1 2 4 3\n2 1 3`,
        expectedOutput: `2\n1`,
        isSample: true,
      }
    ],
  },
  {
    id: 'p5',
    title: 'Binary Tree Diameter Optimization',
    slug: 'tree-diameter-optimization',
    difficulty: 'easy',
    points: 400,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    acceptanceRate: 82.5,
    totalSubmissions: 4120,
    isSolved: true,
    isAttempted: true,
    lastAttemptedAt: new Date(Date.now() - 172800000).toISOString(),
    tags: ['Trees', 'DFS', 'Breadth-First Search'],
    description: `Given a tree with $N$ vertices, compute the diameter of the tree (length of the longest path between any pair of nodes).`,
    inputFormat: `First line contains $N$ ($1 \\le N \\le 10^5$). Next $N-1$ lines contain pairs of connected nodes $u, v$.`,
    outputFormat: `Print the diameter length as an integer.`,
    sampleTestCases: [
      {
        id: 1,
        input: `5\n1 2\n1 3\n3 4\n3 5`,
        expectedOutput: `3`,
        isSample: true,
      }
    ],
  },
  {
    id: 'p6',
    title: 'K-th Smallest Prime Factorization',
    slug: 'kth-smallest-prime-factor',
    difficulty: 'hard',
    points: 1500,
    timeLimitMs: 2500,
    memoryLimitMb: 512,
    acceptanceRate: 18.9,
    totalSubmissions: 640,
    isSolved: false,
    isAttempted: false,
    tags: ['Math', 'Sieve of Eratosthenes', 'Binary Search'],
    description: `Find the $K$-th smallest integer in range $[1, 10^{12}]$ that has exactly $P$ distinct prime factors.`,
    inputFormat: `Single line with integers $K, P$ ($1 \\le K \\le 10^9, 1 \\le P \\le 10$).`,
    outputFormat: `Print the $K$-th smallest such integer.`,
    sampleTestCases: [
      {
        id: 1,
        input: `5 2`,
        expectedOutput: `12`,
        isSample: true,
      }
    ],
  }
];
