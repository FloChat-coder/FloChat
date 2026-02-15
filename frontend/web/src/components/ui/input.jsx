/**
 * Input component for consistent form styling
 * @param {Object} props - Component props
 * @param {string} [props.type='text'] - Input type
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.value] - Input value
 * @param {Function} [props.onChange] - Change handler
 * @param {string} [props.name] - Input name
 * @param {boolean} [props.required=false] - Whether input is required
 * @param {boolean} [props.disabled=false] - Whether input is disabled
 * @param {string} [props.className=''] - Additional CSS classes
 */
function Input({
  type = 'text',
  placeholder,
  value,
  onChange,
  name,
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  const baseClasses = 'w-full px-4 py-3 text-white bg-transparent border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed';

  const classes = `${baseClasses} ${className}`;

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      name={name}
      required={required}
      disabled={disabled}
      className={classes}
      {...props}
    />
  );
}

export default Input;