
import React, { useState, useEffect } from 'react';
import JqlAutocompleteComponent from './JqlAutocompleteComponent';

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

  const handleChange = (newValue: string) => {
    setValue(newValue);
    
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className="jql-editor-mock">
      <JqlAutocompleteComponent
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        autocompleteProvider={autocompleteProvider}
      />
      <div className="mt-2 text-xs text-gray-500">
        <span>Mock JQLEditorAsync ({analyticsSource})</span>
      </div>
    </div>
  );
};
