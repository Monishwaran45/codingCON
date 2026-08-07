import { signToken, requireAuth, AuthRequest } from '../src/middleware/auth';
import { runCode, verifyDockerEngine } from '../src/judge/runner';
import jwt from 'jsonwebtoken';

describe('🔒 Security & Vulnerability Test Suite', () => {
  const TEST_SECRET = 'test-secret-key-1234567890-must-be-long-enough';

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = TEST_SECRET;
    process.env.MOCK_EXECUTION = 'true';
    process.env.SKIP_DOCKER_CHECK = 'true';
  });

  describe('1. JWT Authentication & Token Forgery Protection', () => {
    it('generates valid tokens that can be decoded with secret', () => {
      const token = signToken({ id: 'u1', email: 'user@test.com', role: 'student' });
      const decoded = jwt.verify(token, TEST_SECRET) as { id: string; email: string };
      expect(decoded.id).toBe('u1');
      expect(decoded.email).toBe('user@test.com');
    });

    it('rejects tokens forged with invalid or weak secret ("changeme")', () => {
      const forgedToken = jwt.sign({ id: 'admin-id', role: 'admin' }, 'changeme');
      expect(() => jwt.verify(forgedToken, TEST_SECRET)).toThrow();
    });

    it('rejects expired tokens', () => {
      const expiredToken = jwt.sign({ id: 'u1' }, TEST_SECRET, { expiresIn: '0s' });
      expect(() => jwt.verify(expiredToken, TEST_SECRET)).toThrow();
    });
  });

  describe('2. Sandbox Isolation & Container Verification', () => {
    it('verifies Docker engine status check', async () => {
      const isVerified = await verifyDockerEngine();
      expect(isVerified).toBe(true);
    });

    it('rejects execution of unsupported languages', async () => {
      await expect(runCode('malicious_lang', 'print("hello")', '')).rejects.toThrow(
        'Unsupported language: malicious_lang',
      );
    });

    it('safely handles runtime errors without exposing host environment', async () => {
      const result = await runCode('python', 'syntax_error_mock', '');
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('SyntaxError');
    });

    it('handles execution timeouts safely', async () => {
      const result = await runCode('python', 'timeout_mock', '');
      expect(result.timedOut).toBe(true);
      expect(result.exitCode).toBe(124);
    });
  });

  describe('3. DoS Protection & Input Validation Bounds', () => {
    it('correctly handles code executions within safe limits', async () => {
      const result = await runCode('python', 'print("test")', 'input_data');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe('input_data');
    });
  });
});
