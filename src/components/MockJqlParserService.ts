
/**
 * Mock JQL Parser Service
 * 
 * This is a simplified implementation that doesn't rely on the ANTLR libraries
 * but provides a basic structure for demonstration purposes.
 */

type TokenType = 'FIELD' | 'OPERATOR' | 'VALUE' | 'LOGICAL_OPERATOR' | 'ORDER_BY' | 'GROUPING';

interface Token {
  type: TokenType;
  value: string;
}

interface SimpleAst {
  type: string;
  tokens: Token[];
  raw: string;
}

class MockJqlParserService {
  /**
   * Parse a JQL string and return a simplified AST
   */
  parseJql(jqlString: string): { success: boolean; ast?: SimpleAst; error?: string } {
    try {
      console.log('Mock parsing JQL:', jqlString);
      
      // Very simple tokenization - not actually parsing the grammar
      const tokens: Token[] = [];
      
      // Split by spaces for simple tokenization
      const parts = jqlString.split(/\s+/);
      
      // Simple pattern recognition
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        
        if (i % 3 === 0) {
          // Assume every third word is a field
          tokens.push({ type: 'FIELD', value: part });
        } else if (i % 3 === 1) {
          // Assume every third + 1 word is an operator
          tokens.push({ type: 'OPERATOR', value: part });
        } else {
          // Everything else is a value
          const value = part.startsWith('"') && part.endsWith('"') 
            ? part.substring(1, part.length - 1) 
            : part;
          tokens.push({ type: 'VALUE', value });
          
          // If next part is AND/OR and not the last one
          if (i+1 < parts.length && (parts[i+1] === 'AND' || parts[i+1] === 'OR')) {
            tokens.push({ type: 'LOGICAL_OPERATOR', value: parts[i+1] });
            i++; // Skip the AND/OR in next iteration
          }
        }
      }
      
      // Check for ORDER BY
      const orderByIndex = jqlString.toUpperCase().indexOf('ORDER BY');
      if (orderByIndex >= 0) {
        tokens.push({ type: 'ORDER_BY', value: jqlString.substring(orderByIndex) });
      }
      
      const ast: SimpleAst = {
        type: 'JQL',
        tokens,
        raw: jqlString
      };
      
      console.log('Mock parsed JQL successfully');
      return { success: true, ast };
    } catch (error) {
      console.error('Error in mock parsing JQL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Convert AST to a JSON string
   */
  simplifyAstForDisplay(ast: SimpleAst): string {
    return JSON.stringify(ast, null, 2);
  }
}

export default MockJqlParserService;
