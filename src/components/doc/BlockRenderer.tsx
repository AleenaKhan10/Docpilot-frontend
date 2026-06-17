import { Link as LinkIcon } from "lucide-react";
import Callout from "../ui/Callout";
import RichText from "./RichText";
import type { Block } from "../../lib/doc-types";

const fmtTs = (s?: number) => {
  if (s === undefined) return null;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
};

const BlockRenderer = ({ block }: { block: Block }) => {
  switch (block.type) {
    case "paragraph":
      return (
        <RichText
          html={block.text}
          className="text-[13px] text-t3 leading-[1.75]"
        />
      );

    case "step":
      return (
        <div className="flex gap-4">
          <div className="font-mono text-[11px] text-t5 w-7 flex-shrink-0 pt-0.5 text-right">
            {String(block.number).padStart(2, "0")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-3 mb-1">
              <h4 className="text-[13px] font-medium text-t1 leading-snug">
                {block.title}
              </h4>
              {block.timestamp_seconds !== undefined && (
                <span className="font-mono text-[9px] text-t5">
                  {fmtTs(block.timestamp_seconds)}
                </span>
              )}
            </div>
            {block.detail && (
              <RichText
                html={block.detail}
                className="text-[12px] text-t4 leading-[1.7] mt-1"
              />
            )}
            {block.image_url && (
              <img
                src={block.image_url}
                alt=""
                className="mt-3 rounded-md border border-l1"
              />
            )}
          </div>
        </div>
      );

    case "callout":
      return (
        <Callout kind={block.kind} title={block.title}>
          <RichText html={block.text} />
        </Callout>
      );

    case "code":
      return (
        <div className="rounded-md border border-l1 overflow-hidden">
          {block.caption && (
            <div className="px-4 py-2 bg-s2 border-b border-l1 font-mono text-[10px] text-t4">
              {block.caption}
            </div>
          )}
          <pre className="bg-s1 p-4 text-[12px] font-mono text-t2 overflow-x-auto leading-relaxed">
            <code>{block.code}</code>
          </pre>
        </div>
      );

    case "image":
      return (
        <figure className="rounded-md border border-l1 overflow-hidden bg-s1">
          <img src={block.url} alt={block.alt ?? ""} className="block w-full" />
          {block.caption && (
            <figcaption className="px-4 py-2 text-[11px] text-t5 border-t border-l1">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case "decision":
      return (
        <div className="rounded-md border border-l1 bg-s1 p-4">
          <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-t5 mb-2">
            Decision point
          </div>
          <h4 className="text-[13px] font-medium text-t1 mb-3">
            {block.question}
          </h4>
          <div className="flex flex-col gap-2">
            {block.branches.map((b, i) => (
              <div
                key={i}
                className="border border-l1 rounded-sm px-3 py-2 bg-s2"
              >
                <div className="font-mono text-[9px] uppercase tracking-wide text-t3 mb-1">
                  {b.label}
                </div>
                <div className="text-[12px] text-t3 leading-[1.65]">
                  {b.outcome}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case "list":
      return (
        <div>
          {block.intro && (
            <p className="text-[13px] text-t3 mb-2">{block.intro}</p>
          )}
          {block.ordered ? (
            <ol className="list-decimal list-inside flex flex-col gap-1.5 text-[13px] text-t3 leading-[1.7] marker:text-t5 marker:font-mono marker:text-[11px]">
              {block.items.map((it, i) => (
                <li key={i}>{it}</li>
              ))}
            </ol>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {block.items.map((it, i) => (
                <li
                  key={i}
                  className="text-[13px] text-t3 leading-[1.7] flex gap-2.5"
                >
                  <span className="text-t5 mt-1.5 w-1 h-1 rounded-full bg-t5 flex-shrink-0" />
                  <span className="flex-1">{it}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );

    case "table":
      return (
        <div className="rounded-md border border-l1 overflow-hidden">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-s2">
                {block.headers.map((h, i) => (
                  <th
                    key={i}
                    className="px-3 py-2 text-left font-mono text-[9px] uppercase tracking-wide text-t5 border-b border-l1"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-b border-l1 last:border-0">
                  {row.map((cell, j) => (
                    <td key={j} className="px-3 py-2 text-t3">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {block.caption && (
            <div className="px-3 py-2 text-[11px] text-t5 bg-s2 border-t border-l1">
              {block.caption}
            </div>
          )}
        </div>
      );

    case "link":
      return (
        <a
          href={block.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-start gap-3 rounded-md border border-l1 bg-s1 hover:bg-s2 px-4 py-3 transition"
        >
          <LinkIcon size={14} className="text-t4 mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-medium text-t2 truncate">
              {block.label}
            </div>
            {block.description && (
              <div className="text-[11px] text-t5 mt-0.5 truncate">
                {block.description}
              </div>
            )}
          </div>
        </a>
      );
  }
};

export default BlockRenderer;
