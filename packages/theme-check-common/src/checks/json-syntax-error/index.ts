import { JSONCError, printParseErrorCode } from '../../to-source-code';
import { Severity, SourceCodeType, JSONCheckDefinition } from '../../types';
import { isError } from '../../utils';

function cleanErrorMessage(error: Error) {
  const message = 'rawMessage' in error ? (error.rawMessage as string) : error.message;
  return message.replace(/\s+at \d+:\d+/, '');
}

export const JSONSyntaxError: JSONCheckDefinition = {
  meta: {
    code: 'JSONSyntaxError',
    aliases: ['ValidJson'],
    name: 'Enforce valid JSON',
    docs: {
      description: 'This check exists to prevent invalid JSON files in themes.',
      recommended: true,
      url: 'https://shopify.dev/docs/themes/tools/theme-check/checks/valid-json',
    },
    type: SourceCodeType.JSON,
    severity: Severity.ERROR,
    schema: {},
    targets: [],
  },

  create(context) {
    const error = context.file.ast;
    if (!isError(error)) return {};

    return {
      async onCodePathStart(file) {
        if (error instanceof JSONCError) {
          for (const err of error.errors) {
            context.report({
              message: printParseErrorCode(err.error),
              startIndex: err.offset,
              endIndex: err.offset + err.length,
            });
          }
        } else {
          context.report({
            message: cleanErrorMessage(error),
            startIndex: 0,
            endIndex: file.source.length,
          });
        }
      },
    };
  },
};
