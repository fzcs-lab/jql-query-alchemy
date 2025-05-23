
/**
 * Mock JQL Autocomplete Provider
 * 
 * This provider mocks the behavior of a real JQL autocomplete service
 * by providing hardcoded suggestions for fields, functions, and values.
 * It also integrates with a mock API service for specific field values.
 */
import JqlMockApiService, { API_BACKED_FIELDS, FieldValue } from '../services/JqlMockApiService';

// Type definitions
interface Field {
  id: string;
  displayName: string;
  type: string;
  hasAutocompleteValues: boolean;
}

interface Function {
  id: string;
  displayName: string;
  description: string;
}

interface Suggestion {
  id: string;
  name: string;
  description?: string;
  type?: string;
}

interface SuggestionProps {
  type: 'field' | 'function' | 'operator' | 'value';
  fieldName?: string;
  query?: string;
}

// Mock field suggestions
const FIELDS: Field[] = [
  { id: 'project', displayName: 'Project', type: 'project', hasAutocompleteValues: true },
  { id: 'status', displayName: 'Status', type: 'status', hasAutocompleteValues: true },
  { id: 'assignee', displayName: 'Assignee', type: 'user', hasAutocompleteValues: true },
  { id: 'summary', displayName: 'Summary', type: 'text', hasAutocompleteValues: false },
  { id: 'created', displayName: 'Created', type: 'date', hasAutocompleteValues: false },
  { id: 'priority', displayName: 'Priority', type: 'priority', hasAutocompleteValues: true },
  { id: 'reporter', displayName: 'Reporter', type: 'user', hasAutocompleteValues: true },
  { id: 'duedate', displayName: 'Due Date', type: 'date', hasAutocompleteValues: false },
];

// Mock function suggestions
const FUNCTIONS: Function[] = [
  { id: 'currentUser', displayName: 'currentUser()', description: 'Returns the current user' },
  { id: 'now', displayName: 'now()', description: 'Returns the current date and time' },
  { id: 'membersOf', displayName: 'membersOf("group")', description: 'Returns members of the specified group' },
  { id: 'endOfDay', displayName: 'endOfDay()', description: 'Returns the end of the current day' },
  { id: 'startOfDay', displayName: 'startOfDay()', description: 'Returns the start of the current day' },
  { id: 'endOfWeek', displayName: 'endOfWeek()', description: 'Returns the end of the current week' },
];

// Mock value suggestions based on field type
const FIELD_VALUES: Record<string, FieldValue[]> = {
  project: [
    { id: 'PROJECTA', displayName: 'PROJECTA', description: 'Project A' },
    { id: 'PROJECTB', displayName: 'PROJECTB', description: 'Project B' },
    { id: 'PROJECT C WITH SPACES', displayName: '"PROJECT C WITH SPACES"', description: 'Project with spaces' },
  ],
  user: [
    { id: 'currentUser()', displayName: 'currentUser()', description: 'Current user' },
    { id: 'john.doe', displayName: 'john.doe', description: 'John Doe' },
    { id: 'jane.smith', displayName: 'jane.smith', description: 'Jane Smith' },
    { id: 'admin', displayName: 'admin', description: 'Administrator' },
  ],
};

// Operators based on field type
const OPERATORS_BY_TYPE: Record<string, string[]> = {
  text: ['=', '!=', '~', '!~', 'IS', 'IS NOT', 'IN', 'NOT IN', 'CONTAINS'],
  date: ['=', '!=', '>', '>=', '<', '<=', 'IS', 'IS NOT', 'IN', 'NOT IN'],
  user: ['=', '!=', 'IS', 'IS NOT', 'IN', 'NOT IN', 'WAS', 'WAS NOT', 'CHANGED'],
  project: ['=', '!=', 'IS', 'IS NOT', 'IN', 'NOT IN'],
  status: ['=', '!=', 'IS', 'IS NOT', 'IN', 'NOT IN', 'WAS', 'WAS NOT', 'CHANGED'],
  priority: ['=', '!=', 'IS', 'IS NOT', 'IN', 'NOT IN', 'WAS', 'WAS NOT'],
};

class JqlAutocompleteProvider {
  /**
   * Get suggestions based on the type of query context
   */
  async getSuggestions(props: SuggestionProps): Promise<Suggestion[]> {
    console.log('getSuggestions called with props:', props);
    
    const { type, fieldName } = props;
    
    switch (type) {
      case 'field':
        return this.getFieldSuggestions(props);
      case 'function':
        return this.getFunctionSuggestions(props);
      case 'operator':
        return this.getOperatorSuggestions(props);
      case 'value':
        return this.getValueSuggestions(props);
      default:
        console.log(`Unhandled suggestion type: ${type}`);
        return [];
    }
  }

  /**
   * Get field suggestions
   */
  async getFieldSuggestions(props: SuggestionProps): Promise<Suggestion[]> {
    console.log('getFieldSuggestions called:', props);
    
    return FIELDS.map(field => ({
      id: field.id,
      name: field.displayName,
      type: field.type,
    }));
  }

  /**
   * Get function suggestions
   */
  async getFunctionSuggestions(props: SuggestionProps): Promise<Suggestion[]> {
    console.log('getFunctionSuggestions called:', props);
    
    return FUNCTIONS.map(func => ({
      id: func.id,
      name: func.displayName,
      description: func.description,
    }));
  }

  /**
   * Get operator suggestions based on field type
   */
  async getOperatorSuggestions(props: SuggestionProps): Promise<Suggestion[]> {
    console.log('getOperatorSuggestions called:', props);
    
    const { fieldName } = props;
    const field = FIELDS.find(f => f.id === fieldName);
    
    if (!field) {
      return OPERATORS_BY_TYPE.text.map(op => ({
        id: op,
        name: op,
      }));
    }
    
    const operators = OPERATORS_BY_TYPE[field.type] || OPERATORS_BY_TYPE.text;
    
    return operators.map(op => ({
      id: op,
      name: op,
    }));
  }

  /**
   * Get value suggestions based on field
   */
  async getValueSuggestions(props: SuggestionProps): Promise<Suggestion[]> {
    console.log('getValueSuggestions called:', props);
    
    const { fieldName, query = '' } = props;
    
    if (!fieldName) {
      return [];
    }
    
    const field = FIELDS.find(f => f.id === fieldName);
    
    if (!field || !field.hasAutocompleteValues) {
      return [];
    }
    
    // Check if the field is API-backed
    if (API_BACKED_FIELDS.includes(fieldName)) {
      try {
        // Get values from the API service
        const apiValues = await JqlMockApiService.getFieldValues(fieldName, query);
        return apiValues.map((value: FieldValue) => ({
          id: value.id,
          name: value.displayName,
          description: value.description,
        }));
      } catch (error) {
        console.error('Error fetching API values:', error);
        return [];
      }
    }
    
    // Use static values for non-API fields
    let fieldType = field.type;
    
    // Map user fields to generic user suggestions
    if (fieldType === 'user') {
      return FIELD_VALUES.user.map(value => ({
        id: value.id,
        name: value.displayName,
        description: value.description,
      }));
    }
    
    // Return specific field values if available
    const values = FIELD_VALUES[fieldName] || [];
    return values.map(value => ({
      id: value.id,
      name: value.displayName,
      description: value.description,
    }));
  }
  
  /**
   * Check if a field is API-backed
   */
  isFieldApiBackend(fieldName: string): boolean {
    return API_BACKED_FIELDS.includes(fieldName);
  }
}

export default JqlAutocompleteProvider;
