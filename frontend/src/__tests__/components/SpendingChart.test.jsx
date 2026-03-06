import { render, screen } from '@testing-library/react';
import SpendingChart from '../../components/SpendingChart';

describe('SpendingChart Component', () => {
  test('shows empty state when no categories', () => {
    render(<SpendingChart categories={[]} />);
    expect(screen.getByText('No spending data yet')).toBeInTheDocument();
  });

  test('shows empty state when categories is null', () => {
    render(<SpendingChart categories={null} />);
    expect(screen.getByText('No spending data yet')).toBeInTheDocument();
  });

  test('shows empty state when categories is undefined', () => {
    render(<SpendingChart />);
    expect(screen.getByText('No spending data yet')).toBeInTheDocument();
  });

  test('renders chart when categories provided', () => {
    const categories = [
      { category: 'transfer', total: 500 },
      { category: 'utilities', total: 200 },
    ];
    const { container } = render(<SpendingChart categories={categories} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });
});
