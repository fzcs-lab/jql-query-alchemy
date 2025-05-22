
/**
 * JQL Parser Service
 * 
 * This service handles parsing JQL strings into Abstract Syntax Trees (ASTs)
 * using the @atlassianlabs/jql-parser library.
 */

import { JQLParser, JQLLexer } from '@atlassianlabs/jql-parser';
import { CharStreams, CommonTokenStream } from 'antlr4ts';

class JqlParserService {
  /**
   * Parse a JQL string and return the AST
   */
  parseJql(jqlString: string): { success: boolean; ast?: any; error?: string } {
    try {
      console.log('Parsing JQL:', jqlString);
      
      // Create input stream from the JQL string using antlr4ts
      const inputStream = CharStreams.fromString(jqlString);
      
      // Create lexer from the input stream
      // Need to cast the lexer to any because of type incompatibility between the libraries
      const lexer = new JQLLexer(inputStream as any);
      
      // Create token stream from the lexer
      // Use any to bypass type checking since we're mixing two different ANTLR versions
      const tokenStream = new CommonTokenStream(lexer as any);
      
      // Create parser from the token stream
      const parser = new JQLParser(tokenStream as any);
      
      // Parse the JQL string
      const ast = parser.parse();
      
      console.log('Parsed JQL successfully');
      return { success: true, ast };
    } catch (error) {
      console.error('Error parsing JQL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Convert AST to a simplified string representation
   * This prevents circular reference errors when using JSON.stringify
   */
  simplifyAstForDisplay(ast: any): string {
    const cache = new Set();
    
    const simplify = (obj: any): any => {
      if (obj === null || obj === undefined) {
        return null;
      }
      
      if (typeof obj !== 'object') {
        return obj;
      }
      
      if (cache.has(obj)) {
        return '[Circular]';
      }
      
      cache.add(obj);
      
      if (Array.isArray(obj)) {
        return obj.map(item => simplify(item));
      }
      
      const result: Record<string, any> = {
        type: obj.constructor ? obj.constructor.name : 'Unknown'
      };
      
      // Add a few important properties that might be useful
      if (obj.type) result.nodeType = obj.type;
      if (obj.text) result.text = obj.text;
      if (obj.value) result.value = obj.value;
      if (obj.name) result.name = obj.name;
      if (obj.field) result.field = simplify(obj.field);
      if (obj.operator) result.operator = simplify(obj.operator);
      if (obj.left) result.left = simplify(obj.left);
      if (obj.right) result.right = simplify(obj.right);
      if (obj.children && Array.isArray(obj.children)) {
        result.children = obj.children.map((child: any) => simplify(child));
      }
      
      return result;
    };
    
    try {
      return JSON.stringify(simplify(ast), null, 2);
    } catch (error) {
      console.error('Error simplifying AST:', error);
      return '{ "error": "Could not simplify AST for display" }';
    }
  }
}

export default JqlParserService;
