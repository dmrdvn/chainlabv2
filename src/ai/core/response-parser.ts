export function parseLLMResponse(responseContent: string) {
  const codeBlockRegex = /```(?:[a-zA-Z0-9_\-]+)?\n([\s\S]*?)\n```/g;
  let match;
  const codeBlocks: string[] = [];
  let plainText = responseContent;

  while ((match = codeBlockRegex.exec(responseContent)) !== null) {
    codeBlocks.push(match[1]);
  }

  if (codeBlocks.length > 0) {
    plainText = responseContent.replace(codeBlockRegex, '[Code Block Extracted]').trim();
  }

  return {
    extractedCode: codeBlocks.length > 0 ? codeBlocks.join('\n\n') : null,
    displayText: plainText,
    rawContent: responseContent,
  };
}
