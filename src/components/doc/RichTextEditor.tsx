import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Link as LinkIcon,
  Heading2,
  List as ListIcon,
} from "lucide-react";

interface RichTextEditorProps {
  html: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Render in single-line / compact mode (no heading or list buttons) */
  compact?: boolean;
}

const RichTextEditor = ({
  html,
  onChange,
  placeholder = "Type here…",
  compact = false,
}: RichTextEditorProps) => {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [focused, setFocused] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: compact ? false : { levels: [2, 3] },
        bulletList: compact ? false : {},
        orderedList: compact ? false : {},
        codeBlock: compact ? false : {},
        blockquote: compact ? false : {},
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noreferrer", target: "_blank" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: html || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    editorProps: {
      attributes: {
        class:
          "tiptap-content focus:outline-none text-[13px] text-t2 leading-[1.7]",
      },
    },
  });

  // Keep editor in sync if `html` is replaced externally.
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== html) {
      editor.commands.setContent(html || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html]);

  if (!editor) return null;

  const isActive = (name: string, opts?: object) => editor.isActive(name, opts);

  const handleAddLink = () => {
    const prev = editor.getAttributes("link").href || "";
    setLinkUrl(prev);
    setLinkOpen(true);
  };

  const commitLink = () => {
    if (!linkUrl.trim()) {
      editor.chain().focus().unsetLink().run();
    } else {
      const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
    setLinkOpen(false);
    setLinkUrl("");
  };

  // Show toolbar when the editor is focused OR when there's a selection.
  const showToolbar = focused;

  return (
    <div className="relative">
      {showToolbar && (
        <div className="sticky top-[60px] z-10 mb-2 inline-flex items-center gap-0.5 bg-s2 border border-l2 rounded-md shadow-md px-1 py-1">
          <ToolbarButton
            active={isActive("bold")}
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleBold().run();
            }}
            title="Bold (Ctrl+B)"
          >
            <Bold size={13} />
          </ToolbarButton>
          <ToolbarButton
            active={isActive("italic")}
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleItalic().run();
            }}
            title="Italic (Ctrl+I)"
          >
            <Italic size={13} />
          </ToolbarButton>
          <ToolbarButton
            active={isActive("underline")}
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleUnderline().run();
            }}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon size={13} />
          </ToolbarButton>
          {!compact && (
            <>
              <ToolbarButton
                active={isActive("heading", { level: 2 })}
                onMouseDown={(e) => {
                  e.preventDefault();
                  editor.chain().focus().toggleHeading({ level: 2 }).run();
                }}
                title="Heading"
              >
                <Heading2 size={13} />
              </ToolbarButton>
              <ToolbarButton
                active={isActive("bulletList")}
                onMouseDown={(e) => {
                  e.preventDefault();
                  editor.chain().focus().toggleBulletList().run();
                }}
                title="Bullet list"
              >
                <ListIcon size={13} />
              </ToolbarButton>
            </>
          )}
          <div className="w-px h-4 bg-l2 mx-0.5" />
          <ToolbarButton
            active={isActive("link")}
            onMouseDown={(e) => {
              e.preventDefault();
              handleAddLink();
            }}
            title="Link"
          >
            <LinkIcon size={13} />
          </ToolbarButton>
        </div>
      )}

      <EditorContent editor={editor} />

      {linkOpen && (
        <div className="absolute z-30 top-full mt-1 left-0 bg-s1 border border-l3 rounded-md shadow-2xl p-3 flex items-center gap-2 min-w-[320px]">
          <input
            autoFocus
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitLink();
              if (e.key === "Escape") setLinkOpen(false);
            }}
            placeholder="https://…"
            className="flex-1 bg-s2 border border-l2 rounded-sm px-2.5 py-1.5 text-[12px] text-t1 outline-none focus:border-l3"
          />
          <button
            onClick={commitLink}
            className="text-[11px] font-medium bg-white text-ink rounded-sm px-2.5 py-1.5 hover:opacity-90"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
};

const ToolbarButton = ({
  active,
  onMouseDown,
  title,
  children,
}: {
  active?: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onMouseDown={onMouseDown}
    title={title}
    className={[
      "w-6 h-6 rounded-sm flex items-center justify-center transition",
      active ? "bg-s3 text-white" : "text-t4 hover:bg-s3 hover:text-t2",
    ].join(" ")}
  >
    {children}
  </button>
);

export default RichTextEditor;
