import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

export type AddBlockType =
  | "paragraph"
  | "step"
  | "callout"
  | "image"
  | "link"
  | "list";

interface BlockToolbarProps {
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onAddBelow: (type: AddBlockType) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const ADD_OPTIONS: { type: AddBlockType; label: string }[] = [
  { type: "paragraph", label: "Paragraph" },
  { type: "step", label: "Step" },
  { type: "callout", label: "Callout" },
  { type: "image", label: "Image" },
  { type: "link", label: "Link" },
  { type: "list", label: "Bullet list" },
];

const BlockToolbar = ({
  onMoveUp,
  onMoveDown,
  onDelete,
  onAddBelow,
  canMoveUp,
  canMoveDown,
}: BlockToolbarProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition flex items-center gap-0.5 bg-s2 border border-l2 rounded-sm shadow-md px-0.5 py-0.5 z-10">
      <ToolbarBtn onClick={onMoveUp} disabled={!canMoveUp} title="Move up">
        <ChevronUp size={12} />
      </ToolbarBtn>
      <ToolbarBtn onClick={onMoveDown} disabled={!canMoveDown} title="Move down">
        <ChevronDown size={12} />
      </ToolbarBtn>
      <div className="relative" ref={menuRef}>
        <ToolbarBtn onClick={() => setMenuOpen((o) => !o)} title="Add block below">
          <Plus size={12} />
        </ToolbarBtn>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 bg-s1 border border-l3 rounded-md shadow-xl py-1 min-w-[140px] z-20">
            {ADD_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                onClick={() => {
                  onAddBelow(opt.type);
                  setMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-1.5 text-[11px] text-t2 hover:bg-s2"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <ToolbarBtn onClick={onDelete} title="Delete" danger>
        <Trash2 size={12} />
      </ToolbarBtn>
    </div>
  );
};

const ToolbarBtn = ({
  onClick,
  disabled,
  title,
  danger,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  danger?: boolean;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={[
      "w-6 h-6 rounded-xs flex items-center justify-center transition",
      disabled
        ? "text-l3 cursor-not-allowed"
        : danger
        ? "text-t4 hover:bg-err-bg hover:text-err-fg"
        : "text-t4 hover:bg-s3 hover:text-t2",
    ].join(" ")}
  >
    {children}
  </button>
);

export default BlockToolbar;
