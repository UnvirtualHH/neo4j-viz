import { applySyntaxColouring } from "@neo4j-cypher/language-support";

export const escapeHtml = (str: string): string =>
  str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const highlightCypher = (code: string): string => {
  const tokens = applySyntaxColouring(code);
  let result = "";
  let lastIndex = 0;

  for (const token of tokens) {
    const offset = token.position.startOffset;
    const before = code.slice(lastIndex, offset);
    const content = code.slice(offset, offset + token.length);
    const className = token.tokenType.toLowerCase();

    result += escapeHtml(before) + `<span class="${className}">${escapeHtml(content)}</span>`;
    lastIndex = offset + token.length;
  }

  result += escapeHtml(code.slice(lastIndex));
  return result.replace(/\n/g, "<br>");
};
