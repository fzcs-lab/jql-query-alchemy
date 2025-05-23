
import React, { useState, useRef, useEffect } from 'react';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Input } from '@/components/ui/input';
import JqlAutocompleteProvider from './JqlAutocompleteProvider';

interface JqlAutocompleteComponentProps {
  value: string;
  onChange: (value: string) => void;
  autocompleteProvider: JqlAutocompleteProvider;
  placeholder?: string;
}

interface Suggestion {
  id: string;
  name: string;
  description?: string;
  type?: string;
}

const JqlAutocompleteComponent: React.FC<JqlAutocompleteComponentProps> = ({
  value,
  onChange,
  autocompleteProvider,
  placeholder = 'Enter JQL query...',
}) => {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestType, setSuggestType] = useState<'field' | 'operator' | 'value' | null>(null);
  const [currentFieldName, setCurrentFieldName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSelecting, setIsSelecting] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const commandRef = useRef<HTMLDivElement>(null);
  
  // Function to detect what part of the JQL query we're currently editing
  const detectQueryContext = (query: string, position: number) => {
    if (isSelecting) return null; // Don't detect context while selection is in progress
    
    console.log('Detecting query context at position:', position);
    
    // Get the substring up to the cursor position
    const textUntilCursor = query.substring(0, position);
    const wordsUntilCursor = textUntilCursor.trim().split(/\s+/);
    const lastWord = wordsUntilCursor[wordsUntilCursor.length - 1];
    
    console.log('Words until cursor:', wordsUntilCursor);
    console.log('Last word:', lastWord);
    
    // Improved detection logic for field/operator/value pattern
    let fieldIndex = -1;
    let operatorIndex = -1;
    
    // Look for field and operator pattern
    for (let i = 0; i < wordsUntilCursor.length - 1; i++) {
      // Check if this might be a field followed by an operator
      const potentialField = wordsUntilCursor[i];
      const potentialOperator = wordsUntilCursor[i + 1];
      
      if (potentialOperator && ['=', '!=', '>', '>=', '<', '<=', '~', '!~', 'IN', 'NOT', 'IS', 'CONTAINS', 'WAS'].includes(potentialOperator.toUpperCase())) {
        fieldIndex = i;
        operatorIndex = i + 1;
      }
    }
    
    // If we found a field-operator pair
    if (fieldIndex >= 0 && operatorIndex >= 0) {
      const currentField = wordsUntilCursor[fieldIndex];
      
      // If cursor is right after the operator or in a word after the operator, suggest values
      if (operatorIndex < wordsUntilCursor.length - 1 || 
          (operatorIndex === wordsUntilCursor.length - 1 && query.charAt(position - 1) === ' ')) {
        console.log('Suggesting values for field:', currentField);
        setSuggestType('value');
        setSearchTerm(lastWord);
        setCurrentFieldName(currentField);
        return 'value';
      }
    }
    
    // Simple detection logic (can be improved for more complex JQL)
    if (wordsUntilCursor.length % 3 === 1) {
      // First part of triplet - should be a field
      setSuggestType('field');
      setSearchTerm(lastWord);
      setCurrentFieldName(null);
      return 'field';
    } else if (wordsUntilCursor.length % 3 === 2) {
      // Second part of triplet - should be an operator
      setSuggestType('operator');
      setSearchTerm(lastWord);
      setCurrentFieldName(wordsUntilCursor[wordsUntilCursor.length - 2]);
      return 'operator';
    } else {
      // Third part of triplet - should be a value
      setSuggestType('value');
      setSearchTerm(lastWord);
      setCurrentFieldName(wordsUntilCursor[wordsUntilCursor.length - 3]);
      return 'value';
    }
  };

  // Load suggestions based on current context
  const loadSuggestions = async () => {
    if (!suggestType) return;
    
    try {
      console.log('Loading suggestions for type:', suggestType, 'field:', currentFieldName);
      const props = {
        type: suggestType,
        fieldName: currentFieldName,
        query: searchTerm || '',
      };
      
      const results = await autocompleteProvider.getSuggestions(props);
      console.log('Suggestions loaded:', results);
      setSuggestions(results);
      if (results.length > 0 && !isSelecting) {
        setOpen(true);
        setActiveIndex(0); // Reset active index when new suggestions load
      } else if (results.length === 0) {
        setOpen(false);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  // Handle cursor position changes
  useEffect(() => {
    if (inputRef.current) {
      const handleSelectionChange = () => {
        if (isSelecting) return;
        
        const position = inputRef.current?.selectionStart || 0;
        setCursorPosition(position);
        detectQueryContext(value, position);
      };
      
      const element = inputRef.current;
      element.addEventListener('click', handleSelectionChange);
      element.addEventListener('keyup', handleSelectionChange);
      
      return () => {
        element.removeEventListener('click', handleSelectionChange);
        element.removeEventListener('keyup', handleSelectionChange);
      };
    }
  }, [value, isSelecting]);

  // Load suggestions when context changes
  useEffect(() => {
    if (suggestType) {
      loadSuggestions();
    }
  }, [suggestType, currentFieldName, searchTerm]);

  // Handle selecting a suggestion
  const handleSelect = (selected: Suggestion) => {
    console.log('Selected suggestion:', selected);
    setIsSelecting(true);
    
    try {
      // Split the query into parts
      const beforeCursor = value.substring(0, cursorPosition);
      const afterCursor = value.substring(cursorPosition);
      
      // Get the last word before cursor
      const lastWordMatch = beforeCursor.match(/(\S+)$/);
      const lastWord = lastWordMatch ? lastWordMatch[1] : '';
      const beforeLastWord = lastWordMatch ? beforeCursor.substring(0, beforeCursor.length - lastWord.length) : beforeCursor;
      
      // Create the new query by replacing the current word with the selected suggestion
      const newValue = beforeLastWord + selected.name + ' ' + afterCursor;
      
      onChange(newValue);
      setOpen(false);
      
      // Calculate new cursor position (at the end of the inserted text plus space)
      const newCursorPos = beforeLastWord.length + selected.name.length + 1;
      
      // Set timeout to focus back on the input and put cursor at end of selected suggestion
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
          
          // Trigger context detection after insertion to show next suggestions
          detectQueryContext(newValue, newCursorPos);
        }
        // Allow detection again after selection is complete
        setIsSelecting(false);
      }, 50);
    } catch (error) {
      console.error('Error handling selection:', error);
      setIsSelecting(false);
    }
  };

  // Handle key navigation and escape to close dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Close dropdown on Escape
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    
    // Handle dropdown navigation with arrow keys
    if (open && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault(); // Prevent cursor movement in input
        setActiveIndex(prev => (prev + 1) % suggestions.length);
        return;
      }
      
      if (e.key === 'ArrowUp') {
        e.preventDefault(); // Prevent cursor movement in input
        setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      
      // Select active item with Enter
      if (e.key === 'Enter' && activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault(); // Prevent form submission
        handleSelect(suggestions[activeIndex]);
        return;
      }
    }
  };

  // Handle input changes without interfering with dropdown
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSelecting) return;
    
    const newValue = e.target.value;
    onChange(newValue);
    
    // Update cursor position
    const newPosition = e.target.selectionStart || 0;
    setCursorPosition(newPosition);
    detectQueryContext(newValue, newPosition);
  };

  const handleFocus = () => {
    // Only show suggestions if we have a query context
    detectQueryContext(value, inputRef.current?.selectionStart || 0);
  };

  // Close dropdown when clicking outside
  const handleBlur = (e: React.FocusEvent) => {
    // Don't close if clicking on a suggestion
    if (e.relatedTarget && e.relatedTarget.closest('.command-item')) {
      return;
    }
    
    // Give a small delay to allow selection to complete
    setTimeout(() => setOpen(false), 150);
  };

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="w-full font-mono"
        placeholder={placeholder}
        autoComplete="off"
      />
      
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 z-50">
          <Command ref={commandRef} className="rounded-lg border shadow-md bg-white overflow-hidden">
            <CommandList className="max-h-[200px] overflow-y-auto py-2">
              <CommandGroup heading={suggestType === 'field' ? 'Fields' : suggestType === 'operator' ? 'Operators' : 'Values'}>
                {suggestions.map((suggestion, index) => (
                  <CommandItem
                    key={suggestion.id}
                    value={suggestion.id}
                    onSelect={() => handleSelect(suggestion)}
                    className={`command-item cursor-pointer px-3 py-2 ${index === activeIndex ? 'bg-blue-50 text-blue-700' : 'hover:bg-blue-50'}`}
                  >
                    <span className="font-medium">{suggestion.name}</span>
                    {suggestion.description && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {suggestion.description}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
};

export default JqlAutocompleteComponent;

