
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

declare module '@atlaskit/jql-editor-common' {
  export interface JqlEditorAutocompleteProvider {
    getSuggestions(props: any): Promise<any>;
    getFieldSuggestions(props: any): Promise<any>;
    getFunctionSuggestions(props: any): Promise<any>;
  }
}

declare module '@atlassianlabs/jql-parser' {
  export class JQLParser {
    constructor();
    parse(input: string): any;
  }
  
  export class JQLLexer {
    constructor(input: any);
  }
  
  export const CommonTokenStream: any;
  export const InputStream: any;
}
