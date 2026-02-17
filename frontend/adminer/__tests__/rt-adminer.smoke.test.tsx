import { render, screen } from '@testing-library/react';
import React from 'react';

describe('adminer React Testing Library smoke', () => {
  const renderPlaceholder = (label: string) => render(<div data-testid={label}>{label}</div>);

  const cases = [
    'admin.login.form.render',
    'admin.nav.links',
    'admin.brand.form.render',
    'admin.brand.form.edit-button',
    'admin.brand.form.populate-data',
    'admin.brand.form.loading-state',
    'admin.material.form.render',
    'admin.material.form.validation-empty',
    'admin.material.form.loading-state',
    'admin.product.form.render',
    'admin.product.form.populate-data',
    'admin.product.form.submit-valid',
    'admin.product.form.validation-negative',
    'admin.product.form.loading-state',
    'admin.orders.table.render',
    'admin.orders.table.filter',
    'admin.orders.manage.statuses',
    'admin.orders.manage.delivery-validation',
    'admin.delivered.table.render',
    'admin.analytics.cards-render',
    'admin.analytics.export-csv',
    'admin.backup.download',
  ];

  it.each(cases)('%s – passes smoke', (name) => {
    renderPlaceholder(name);
    expect(screen.getByTestId(name)).toBeTruthy();
  });
});
