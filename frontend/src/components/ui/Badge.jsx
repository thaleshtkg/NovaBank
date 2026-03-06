export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700 dark:bg-dark-border dark:text-gray-300',
    success: 'bg-success-50 text-success-600 dark:bg-success-600/20 dark:text-success-500',
    danger: 'bg-danger-50 text-danger-600 dark:bg-danger-600/20 dark:text-danger-500',
    warning: 'bg-warning-50 text-warning-600 dark:bg-warning-600/20 dark:text-warning-500',
    primary: 'bg-primary-50 text-primary-600 dark:bg-primary-600/20 dark:text-primary-400',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
