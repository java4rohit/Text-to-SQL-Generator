import React from 'react';

interface VoiceInputButtonProps {
  isListening: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  isListening,
  disabled = false,
  onClick,
}) => {
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`absolute right-3 bottom-3 p-2.5 rounded-lg transition-all duration-200 ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg'
            : 'bg-orange-500 hover:bg-orange-600 shadow-md'
        } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isListening ? 'Stop recording' : 'Start voice input'}
      >
        {isListening ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>
      {isListening && (
        <div className="absolute left-3 top-3 flex items-center space-x-2 bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-medium">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span>Listening...</span>
        </div>
      )}
    </>
  );
};
