import { render, screen } from '@testing-library/react';
import Badge from '@/components/ui/Badge';

describe('Badge Component', () => {
  test('renders children text', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  test('applies default variant', () => {
    const { container } = render(<Badge>Default</Badge>);
    expect(container.firstChild.className).toContain('bg-gray-100');
  });

  test('applies success variant', () => {
    const { container } = render(<Badge variant="success">Paid</Badge>);
    expect(container.firstChild.className).toContain('text-success-600');
  });

  test('applies danger variant', () => {
    const { container } = render(<Badge variant="danger">Overdue</Badge>);
    expect(container.firstChild.className).toContain('text-danger-600');
  });

  test('applies warning variant', () => {
    const { container } = render(<Badge variant="warning">Pending</Badge>);
    expect(container.firstChild.className).toContain('text-warning-600');
  });

  test('applies primary variant', () => {
    const { container } = render(<Badge variant="primary">Info</Badge>);
    expect(container.firstChild.className).toContain('text-primary-600');
  });

  test('applies custom className', () => {
    const { container } = render(<Badge className="ml-2">Tag</Badge>);
    expect(container.firstChild.className).toContain('ml-2');
  });

  test('renders as a span', () => {
    const { container } = render(<Badge>Span</Badge>);
    expect(container.firstChild.tagName).toBe('SPAN');
  });
});
