/**
 * Synchronous Auth Token Resolver
 * Allows API client and Socket.io to fetch the JWT token instantly
 * without dynamic async imports.
 */

let memoryToken: string | undefined;

export function setMemoryToken(token?: string): void {
  memoryToken = token;
}

export function getAuthToken(): string | undefined {
  if (memoryToken) return memoryToken;

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('codingcon-auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        const token = parsed?.state?.user?.token;
        if (token) {
          memoryToken = token;
          return token;
        }
      }
    } catch {
      // ignore JSON parse or localStorage access errors
    }
  }
  return undefined;
}
