import { parseResetPasswordFragment } from './login';

describe('parseResetPasswordFragment', () => {
  it('reads and decodes the API password reset link fragment', () => {
    expect(parseResetPasswordFragment('#email=user%2Btest%40example.com&token=token_value')).toEqual({
      email: 'user+test@example.com',
      token: 'token_value',
    });
  });

  it('returns null when the fragment does not contain both reset values', () => {
    expect(parseResetPasswordFragment('#email=user%40example.com')).toBeNull();
  });
});
