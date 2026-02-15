/**
 * Select component for consistent form dropdown styling
 * @param {Object} props - Component props
 * @param {Array} [props.options=[]] - Array of options (strings or objects with value/label)
 * @param {string} [props.value] - Selected value
 * @param {Function} [props.onChange] - Change handler
 * @param {string} [props.name] - Select name
 * @param {string} [props.placeholder='Select an option'] - Placeholder text
 * @param {boolean} [props.required=false] - Whether select is required
 * @param {boolean} [props.disabled=false] - Whether select is disabled
 * @param {string} [props.className=''] - Additional CSS classes
 */
function Select({
  options = [],
  value,
  onChange,
  name,
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  const baseClasses = 'w-full px-4 py-3 text-white bg-transparent border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed';

  const classes = `${baseClasses} ${className}`;

  return (
    <select
      value={value}
      onChange={onChange}
      name={name}
      required={required}
      disabled={disabled}
      className={classes}
      {...props}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((option, index) => (
        <option key={index} value={option.value || option} className="bg-gray-900 text-white">
          {option.label || option}
        </option>
      ))}
    </select>
  );
}

export default Select;