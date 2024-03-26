import { LanguageService, TextDocument, getLanguageService } from 'vscode-json-languageservice';
import { JsonValidationSet, SourceCodeType, ValidateJSON } from './types';

/** This simply memoizes the result to prevent over fetching */
export class JSONValidator {
  private service: LanguageService;

  constructor(private jsonValidationSet: JsonValidationSet) {
    this.jsonValidationSet = jsonValidationSet;
    this.service = getLanguageService({
      schemaRequestService: this.getSchemaForURI.bind(this),
    });
    this.service.configure({
      schemas: Object.values(this.jsonValidationSet.schemas).map((schemaDefinition) => ({
        uri: schemaDefinition.uri,
        fileMatch: schemaDefinition.fileMatch,
      })),
    });
  }

  /**
   * Will return an array of diagnostics for the given source code and JSON string.
   *
   * It's up to the caller to determine where in the file those should be.
   * (presumably by doing some offset logic)
   */
  public validate: ValidateJSON<SourceCodeType> = async (sourceCode, jsonString) => {
    const jsonTextDocument = TextDocument.create(
      'file:' + sourceCode.absolutePath,
      'json',
      0,
      jsonString,
    );
    const jsonDocument = this.service.parseJSONDocument(jsonTextDocument);
    const diagnostics = await this.service.doValidation(jsonTextDocument, jsonDocument, {
      schemaValidation: 'error',
      trailingCommas: 'error', // TODO, change this when we support commas
      comments: 'error', // TODO, change this when we support comments
    });
    return diagnostics.map((diagnostic) => ({
      message: diagnostic.message,
      startIndex: jsonTextDocument.offsetAt(diagnostic.range.start),
      endIndex: jsonTextDocument.offsetAt(diagnostic.range.end),
    }));
  };

  private async getSchemaForURI(uri: string): Promise<string> {
    const promise = this.jsonValidationSet.schemas[uri]?.schema;
    if (!promise) throw new Error(`No schema for ${uri}`);
    return promise;
  }
}
