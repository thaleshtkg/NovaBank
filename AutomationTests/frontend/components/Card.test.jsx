import { render, screen } from '@testing-library/react';
import Card from '@/components/ui/Card';

describe('Card Component', () => {
  test('renders children', () => {
    render(<Card><p>Card content</p></Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  test('has base styling', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstChild;
    expect(card.className).toContain('bg-white');
    expect(card.className).toContain('rounded-xl');
  });

  test('adds hover styling when hover=true', () => {
    const { container } = render(<Card hover>Hover</Card>);
    const card = container.firstChild;
    expect(card.className).toContain('hover:shadow-md');
    expect(card.className).toContain('cursor-pointer');
  });

  test('no hover styling by default', () => {
    const { container } = render(<Card>No hover</Card>);
    const card = container.firstChild;
    expect(card.className).not.toContain('cursor-pointer');
  });

  test('applies custom className', () => {
    const { container } = render(<Card className="p-4">Styled</Card>);
    expect(container.firstChild.className).toContain('p-4');
  });

  test('passes extra props', () => {
    render(<Card data-testid="test-card">Test</Card>);
    expect(screen.getByTestId('test-card')).toBeInTheDocument();
  });
});
