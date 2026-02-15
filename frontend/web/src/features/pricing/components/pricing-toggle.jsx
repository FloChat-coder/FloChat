const PricingToggle = ({ isMonthly, onToggle }) => {
  return (
    <div
      className="relative p-1 max-w-max mx-auto bg-gradient-radial-dark-light rounded-full cursor-pointer"
      onClick={onToggle}
    >
      <input className="opacity-0 absolute top-0 left-0 z-10 w-full h-full" type="checkbox" />
      <div className="flex flex-wrap items-center">
        <div className="relative w-full sm:w-auto">
          <a
            className={`block py-5 px-9 text-center focus:ring-4 focus:ring-white focus:ring-opacity-40 font-medium rounded-full transition-all duration-200 ${
              isMonthly ? 'text-black bg-white' : 'text-gray-300'
            }`}
            href="#"
          >
            Monthly billing
          </a>
        </div>
        <div className="relative flex-1">
          <a
            className={`flex flex-wrap items-center justify-center py-3.5 px-9 text-center rounded-full transition-all duration-200 ${
              !isMonthly ? 'bg-white' : ''
            }`}
            href="#"
          >
            <p className={`mr-2.5 font-medium ${!isMonthly ? 'text-black' : 'text-gray-300'}`}>
              Annual billing
            </p>
            <span className="px-3 py-1.5 text-sm font-medium text-center text-green-400 uppercase border border-green-400 rounded-full">
              Save 20%
            </span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default PricingToggle;