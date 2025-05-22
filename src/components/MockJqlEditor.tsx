
import React, { useState, useEffect } from 'react';

interface JQLEditorAsyncProps {
  defaultValue?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  analyticsSource: string;
  autocompleteProvider: any;
}

// This is a mock implementation of the JQLEditorAsync component
export const JQLEditorAsync: React.FC<JQLEditorAsyncProps> = ({
  defaultValue = '',
  placeholder = 'Enter JQL...',
  onChange,
  analyticsSource,
  autocompleteProvider
}) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    // Call onChange with the initial value when the component mounts
    if (onChange && defaultValue) {
      onChange(defaultValue);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className="jql-editor-mock">
      <textarea
        className="w-full h-24 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label="JQL Editor"
      />
      <div className="mt-2 text-xs text-gray-500">
        <span>Mock JQLEditorAsync ({analyticsSource})</span>
      </div>
    </div>
  );
};
