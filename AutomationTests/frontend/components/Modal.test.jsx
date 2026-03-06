import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '@/components/ui/Modal';

describe('Modal Component', () => {
  test('renders nothing when closed', () => {
    render(<Modal isOpen={false} onClose={() => {}} title="Test">Content</Modal>);
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  test('renders content when open', () => {
    render(<Modal isOpen={true} onClose={() => {}} title="Test Modal">Modal content</Modal>);
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  test('displays title', () => {
    render(<Modal isOpen={true} onClose={() => {}} title="My Title">Body</Modal>);
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });

  test('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<Modal isOpen={true} onClose={onClose} title="Test">Content</Modal>);
    fireEvent.click(screen.getByTestId('modal-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when backdrop clicked', () => {
    const onClose = vi.fn();
    render(<Modal isOpen={true} onClose={onClose} title="Test">Content</Modal>);
    const overlay = screen.getByTestId('modal-overlay');
    const backdrop = overlay.querySelector('.bg-black\\/50');
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  test('sets body overflow hidden when open', () => {
    const { unmount } = render(
      <Modal isOpen={true} onClose={() => {}} title="Test">Content</Modal>
    );
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });
});
