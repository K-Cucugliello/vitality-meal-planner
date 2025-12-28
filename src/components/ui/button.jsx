export const Button = ({ children, variant, size, className, ...props }) => (
  <button className={`px-4 py-2 rounded-md font-medium transition-colors ${className}`} {...props}>
    {children}
  </button>
);