
// Type declarations for JQL-related modules
declare module '@atlaskit/jql-editor' {
  export const JQLEditorAsync: React.FC<{
    defaultValue?: string;
    placeholder?: string;
    onChange?: (value: string) => void;
    analyticsSource: string;
    autocompleteProvider: any;
  }>;
}

declare module '@atlassianlabs/jql-parser' {
  export class JQLParser {
    constructor(input: any);
    parse(): any;
  }
  
  export class JQLLexer {
    constructor(input: any);
  }
  
  export const CommonTokenStream: any;
  export const InputStream: any;
}
