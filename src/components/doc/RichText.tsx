import DOMPurify from "dompurify";

interface RichTextProps {
  html: string;
  className?: string;
  /** Wrap inline-only HTML in a span (no margin), instead of a block div. */
  inline?: boolean;
}

/**
 * Renders sanitized rich-text HTML produced by the TipTap editor.
 *
 * Legacy / Pass-2-generated content that isn't HTML still renders correctly:
 * a plain string is a valid HTML "text node" and survives sanitization. So
 * the same component handles both old plain-text blocks and new edited HTML.
 *
 * The wrapper has the `tiptap-content` class which styles paragraphs,
 * headings, lists, bold/italic/underline, and links to match the rest of
 * the obsidian theme.
 */
const RichText = ({ html, className, inline }: RichTextProps) => {
  const clean = DOMPurify.sanitize(html ?? "", {
    ALLOWED_TAGS: [
      "p", "br", "strong", "b", "em", "i", "u", "s", "strike",
      "a", "code", "blockquote",
      "h2", "h3", "h4",
      "ul", "ol", "li",
      "span",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class"],
    ALLOW_DATA_ATTR: false,
    // Force safe link attributes
    ADD_ATTR: ["target", "rel"],
  });

  const Tag = inline ? "span" : "div";
  return (
    <Tag
      className={["tiptap-content", className].filter(Boolean).join(" ")}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
};

export default RichText;
