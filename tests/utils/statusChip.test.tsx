import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { getStatusChip } from '../../src/utils/chatUtils';

describe('getStatusChip', () => {
  it.each([
    ['IN_PROGRESS', 'In progress'],
    ['NO_SHOW', 'No-show'],
  ])('labels %s as "%s"', (status, label) => {
    render(getStatusChip(status));
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
