const Loading = ({ message = 'Loading...', fullScreen = false }) => {
  const containerClass = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-gray-900 z-50'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClass}>
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
        </div>
        <p className="text-white">{message}</p>
      </div>
    </div>
  );
};

export default Loading;