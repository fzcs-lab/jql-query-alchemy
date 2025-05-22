
import React, { useState, useEffect } from 'react';
import { JQLEditorAsync } from './MockJqlEditor';
import JqlAutocompleteProvider from './JqlAutocompleteProvider';
import JqlParserService from './JqlParserService';
import MockJqlParserService from './MockJqlParserService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowRight } from 'lucide-react';

const DEFAULT_JQL = 'project = PROJECTA AND status = "In Progress" ORDER BY created DESC';

const JqlEditorComponent: React.FC = () => {
  const [jqlQuery, setJqlQuery] = useState<string>(DEFAULT_JQL);
  const [parsedAst, setParsedAst] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [useMockParser, setUseMockParser] = useState<boolean>(false);

  const autocompleteProvider = new JqlAutocompleteProvider();
  const parserService = new JqlParserService();
  const mockParserService = new MockJqlParserService();

  // Check if the antlr parser works
  useEffect(() => {
    try {
      const result = parserService.parseJql("project = TEST");
      if (!result.success) {
        console.warn("Falling back to mock parser due to initialization error");
        setUseMockParser(true);
      }
    } catch (error) {
      console.error("Error initializing parser:", error);
      setUseMockParser(true);
    }
  }, []);

  // Handle JQL change
  const handleJqlChange = (query: string) => {
    console.log('JQL changed:', query);
    setJqlQuery(query);
  };

  // Parse current JQL
  const handleParseJql = () => {
    if (!jqlQuery.trim()) {
      setParseResult({
        success: false,
        message: 'Please enter a JQL query to parse.',
      });
      return;
    }

    try {
      // Use the appropriate parser based on availability
      const result = useMockParser 
        ? mockParserService.parseJql(jqlQuery)
        : parserService.parseJql(jqlQuery);
      
      if (result.success && result.ast) {
        console.log('Full AST:', result.ast);
        const simplified = useMockParser
          ? mockParserService.simplifyAstForDisplay(result.ast)
          : parserService.simplifyAstForDisplay(result.ast);
        setParsedAst(simplified);
        setParseResult({
          success: true,
          message: `JQL parsed successfully! ${useMockParser ? '(Using mock parser)' : ''} Check the console for the full AST.`,
        });
      } else {
        setParsedAst(null);
        setParseResult({
          success: false,
          message: `Error parsing JQL: ${result.error || 'Unknown error'}`,
        });
      }
    } catch (error) {
      console.error("Error during parsing:", error);
      
      // If the real parser failed, try the mock parser
      if (!useMockParser) {
        try {
          console.log("Falling back to mock parser");
          setUseMockParser(true);
          const mockResult = mockParserService.parseJql(jqlQuery);
          
          if (mockResult.success && mockResult.ast) {
            const simplified = mockParserService.simplifyAstForDisplay(mockResult.ast);
            setParsedAst(simplified);
            setParseResult({
              success: true,
              message: 'JQL parsed with mock parser (fallback). Check the console for details.',
            });
            return;
          }
        } catch (mockError) {
          console.error("Mock parser also failed:", mockError);
        }
      }
      
      setParsedAst(null);
      setParseResult({
        success: false,
        message: `Error parsing JQL: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">JQL Editor & Parser POC</h1>
      
      <Card className="p-6 mb-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">JQL Editor</h2>
        
        <div className="mb-4 border rounded-md p-4 bg-white min-h-[120px]">
          {/* JQL Editor Component */}
          <JQLEditorAsync
            defaultValue={DEFAULT_JQL}
            placeholder="Enter JQL query..."
            onChange={handleJqlChange}
            analyticsSource="jql-editor-poc-app"
            autocompleteProvider={autocompleteProvider}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Current Query:</label>
          <pre className="p-3 bg-gray-100 border rounded-md text-sm whitespace-pre-wrap overflow-x-auto">
            {jqlQuery || '<empty>'}
          </pre>
        </div>
        
        <div className="flex justify-between items-center">
          <Button 
            onClick={handleParseJql}
            className="flex items-center"
          >
            Parse Current JQL
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          
          {useMockParser && (
            <span className="text-xs text-amber-600">
              Using mock parser (ANTLR parser unavailable in browser)
            </span>
          )}
        </div>
      </Card>
      
      {/* Parse Result Alert */}
      {parseResult && (
        <Alert className={`mb-6 ${parseResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <AlertTitle className={parseResult.success ? 'text-green-800' : 'text-red-800'}>
            {parseResult.success ? 'Success' : 'Error'}
          </AlertTitle>
          <AlertDescription className={parseResult.success ? 'text-green-700' : 'text-red-700'}>
            {parseResult.message}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Parsed AST */}
      {parsedAst && (
        <Card className="p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            {useMockParser ? 'Simplified Mock AST' : 'Simplified AST'}
          </h2>
          <div className="overflow-auto">
            <pre className="p-3 bg-gray-100 border rounded-md text-sm max-h-80">
              {parsedAst}
            </pre>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Note: {useMockParser 
              ? 'This is using a simple mock parser as ANTLR is not fully compatible with browser environments.' 
              : 'This is a simplified view. Full AST is available in the browser console.'}
          </p>
        </Card>
      )}
      
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>React JQL Editor and Parser POC</p>
        <p className="text-xs mt-1">
          Note: This POC uses mock data and doesn't make actual API calls.
        </p>
      </footer>
    </div>
  );
};

export default JqlEditorComponent;
