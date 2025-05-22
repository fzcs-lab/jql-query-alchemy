
import React, { useState, useRef, useEffect } from 'react';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import JqlAutocompleteProvider from './JqlAutocompleteProvider';
import { Input } from '@/components/ui/input';

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

  // Function to detect what part of the JQL query we're currently editing
  const detectQueryContext = (query: string, position: number) => {
    console.log('Detecting query context at position:', position);
    
    // Get the substring up to the cursor position
    const textUntilCursor = query.substring(0, position);
    const wordsUntilCursor = textUntilCursor.trim().split(/\s+/);
    const lastWord = wordsUntilCursor[wordsUntilCursor.length - 1];
    
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
      if (results.length > 0) {
        setOpen(true);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  // Handle cursor position changes
  useEffect(() => {
    if (inputRef.current) {
      const handleSelectionChange = () => {
        const position = inputRef.current?.selectionStart || 0;
        setCursorPosition(position);
        detectQueryContext(value, position);
      };
      
      inputRef.current.addEventListener('click', handleSelectionChange);
      inputRef.current.addEventListener('keyup', handleSelectionChange);
      
      return () => {
        inputRef.current?.removeEventListener('click', handleSelectionChange);
        inputRef.current?.removeEventListener('keyup', handleSelectionChange);
      };
    }
  }, [value]);

  // Load suggestions when context changes
  useEffect(() => {
    if (suggestType) {
      loadSuggestions();
    }
  }, [suggestType, currentFieldName, searchTerm]);

  // Handle selecting a suggestion
  const handleSelect = (selected: Suggestion) => {
    console.log('Selected suggestion:', selected);
    
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
  };

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full font-mono"
        placeholder={placeholder}
        onFocus={() => detectQueryContext(value, cursorPosition)}
      />
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="absolute top-0 left-0 h-0 w-0" />
        </PopoverTrigger>
        <PopoverContent
          className="p-0 w-[300px]"
          align="start"
          side="bottom"
          sideOffset={5}
        >
          <Command>
            <CommandInput placeholder="Search suggestions..." 
              value={searchTerm}
              onValueChange={(search) => {
                setSearchTerm(search);
              }}
            />
            <CommandList>
              <CommandEmpty>No suggestions found</CommandEmpty>
              <CommandGroup heading={suggestType === 'field' ? 'Fields' : suggestType === 'operator' ? 'Operators' : 'Values'}>
                {suggestions.map((suggestion) => (
                  <CommandItem
                    key={suggestion.id}
                    value={suggestion.id}
                    onSelect={() => handleSelect(suggestion)}
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
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default JqlAutocompleteComponent;
