
/**
 * Mock API Service for JQL field values
 * 
 * This service simulates API calls to fetch values for specific JQL fields
 * with artificial delay to mimic network requests
 */

// Fields that should use the API instead of static values
export const API_BACKED_FIELDS = ['status', 'priority'];

// Type definition for field values
export interface FieldValue {
  id: string;
  displayName: string;
  description: string;
}

// Simulated backend data for API responses
const API_VALUES: Record<string, FieldValue[]> = {
  status: [
    { id: 'Open', displayName: 'Open', description: 'Issue is open' },
    { id: 'In Progress', displayName: '"In Progress"', description: 'Issue is being worked on' },
    { id: 'Review', displayName: 'Review', description: 'Issue is under review' },
    { id: 'Testing', displayName: 'Testing', description: 'Issue is being tested' },
    { id: 'Closed', displayName: 'Closed', description: 'Issue is closed' },
    { id: 'Done', displayName: 'Done', description: 'Issue is completed' },
  ],
  priority: [
    { id: 'Highest', displayName: 'Highest', description: 'Highest priority' },
    { id: 'High', displayName: 'High', description: 'High priority' },
    { id: 'Medium', displayName: 'Medium', description: 'Medium priority' },
    { id: 'Low', displayName: 'Low', description: 'Low priority' },
    { id: 'Lowest', displayName: 'Lowest', description: 'Lowest priority' },
  ]
};

export class JqlMockApiService {
  /**
   * Get values for a specific field from the mock API
   * @param fieldName The field name to get values for
   * @param searchQuery Optional search query to filter values
   * @returns Promise that resolves to an array of field values
   */
  async getFieldValues(fieldName: string, searchQuery: string = ''): Promise<FieldValue[]> {
    // Check if this field has API-backed values
    if (!API_BACKED_FIELDS.includes(fieldName)) {
      return Promise.reject(new Error(`Field ${fieldName} is not API-backed`));
    }

    // Simulate API delay (between 500ms and 1.5s)
    const delay = Math.random() * 1000 + 500;
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const values = API_VALUES[fieldName as keyof typeof API_VALUES] || [];
        
        // Filter values if a search query is provided
        const filteredValues = searchQuery 
          ? values.filter(val => 
              val.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              val.description.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : values;
          
        resolve(filteredValues);
      }, delay);
    });
  }
  
  /**
   * Check if a field is backed by the API
   * @param fieldName The field name to check
   * @returns true if the field is API-backed, false otherwise
   */
  isFieldApiBackend(fieldName: string): boolean {
    return API_BACKED_FIELDS.includes(fieldName);
  }
}

export default new JqlMockApiService();
