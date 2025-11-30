import { useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative w-full max-w-md">
      <div
        className={`flex items-center bg-white rounded-lg border-2 transition-all ${
          isFocused ? 'border-primary-500 shadow-lg' : 'border-gray-200'
        }`}
      >
        <FiSearch className="ml-3 text-gray-400" size={20} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search files and folders..."
          className="flex-1 px-3 py-2 outline-none bg-transparent"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="mr-2 p-1 hover:bg-gray-100 rounded transition"
          >
            <FiX className="text-gray-400" size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
