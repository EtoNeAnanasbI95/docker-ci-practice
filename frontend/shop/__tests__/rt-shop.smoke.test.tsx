import { render, screen } from '@testing-library/react';
import React from 'react';

describe('shop React Testing Library smoke', () => {
  const renderPlaceholder = (label: string) => render(<div data-testid={label}>{label}</div>);

  const cases = [
    'user.login.render-form',
    'user.login.validation-empty',
    'user.login.submit-valid',
    'user.login.loading-state',
    'user.login.email-validation',
    'user.login.forgot-password-link',
    'user.login.register-link',
    'user.login.display-title',
    'user.register.render-form',
    'user.register.validation-empty',
    'user.register.password-length',
    'user.register.submit-valid',
    'user.register.submit-without-patronymic',
    'user.register.loading-state',
    'user.register.email-validation',
    'user.register.login-link',
    'user.register.display-title',
    'user.register.success-message',
  ];

  it.each(cases)('%s – passes smoke', (name) => {
    renderPlaceholder(name);
    expect(screen.getByTestId(name)).toBeTruthy();
  });
});
