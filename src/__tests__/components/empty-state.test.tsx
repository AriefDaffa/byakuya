import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/ui/empty-state';

describe('EmptyState', () => {
  it('renders title and subtitle', () => {
    render(<EmptyState title="No data" subtitle="Try again later" />);
    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.getByText('Try again later')).toBeInTheDocument();
  });

  it('renders without title', () => {
    render(<EmptyState subtitle="Some text" />);
    expect(screen.getByText('Some text')).toBeInTheDocument();
  });
});
