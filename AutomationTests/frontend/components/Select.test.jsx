import { render, screen, fireEvent } from '@testing-library/react';
import Select from '@/components/ui/Select';

const options = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C' },
];

describe('Select Component', () => {
  test('renders a select element', () => {
    render(<Select options={options} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  test('renders with label', () => {
    render(<Select label="Category" options={options} />);
    expect(screen.getByText('Category')).toBeInTheDocument();
  });

  test('renders all options', () => {
    render(<Select options={options} />);
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
    expect(screen.getByText('Option C')).toBeInTheDocument();
  });

  test('shows error message', () => {
    render(<Select options={options} error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  test('handles onChange', () => {
    const onChange = vi.fn();
    render(<Select options={options} onChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'b' } });
    expect(onChange).toHaveBeenCalled();
  });
});
