/**
 * Renderer markdown ringan untuk balasan AI PANDA.
 *
 * Sengaja tanpa dependensi luar (project ini tidak memakai react-markdown /
 * marked). Mendukung subset yang benar-benar dikeluarkan model:
 * heading, bold, italic, inline code, code block, list bullet & bernomor,
 * blockquote, link, dan paragraf. Dipakai bersama oleh Ask PANDA umum dan
 * panel Ask PANDA di Study Pack supaya format balasan konsisten.
 */

const INLINE_REGEX = /(\*\*[^*]+\*\*)|(\*[^*\n]+\*)|(_[^_\n]+_)|(`[^`]+`)|(\[[^\]]+\]\([^)]+\))/g;

function renderInline(text, keyPrefix) {
    const nodes = [];
    let lastIndex = 0;
    let match;
    let i = 0;

    INLINE_REGEX.lastIndex = 0;

    while ((match = INLINE_REGEX.exec(text)) !== null) {
        if (match.index > lastIndex) {
            nodes.push(text.slice(lastIndex, match.index));
        }

        const token = match[0];
        const key = `${keyPrefix}-${i++}`;

        if (token.startsWith("**")) {
            nodes.push(
                <strong key={key} className="font-semibold text-gray-900 dark:text-white">
                    {token.slice(2, -2)}
                </strong>
            );
        } else if (token.startsWith("`")) {
            nodes.push(
                <code
                    key={key}
                    className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[0.85em] text-gray-800 dark:bg-white/[0.08] dark:text-gray-100"
                >
                    {token.slice(1, -1)}
                </code>
            );
        } else if (token.startsWith("[")) {
            const link = /\[([^\]]+)\]\(([^)]+)\)/.exec(token);
            nodes.push(
                <a
                    key={key}
                    href={link[2]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-500 underline underline-offset-2 dark:text-brand-400"
                >
                    {link[1]}
                </a>
            );
        } else {
            nodes.push(
                <em key={key} className="italic">
                    {token.slice(1, -1)}
                </em>
            );
        }

        lastIndex = INLINE_REGEX.lastIndex;
    }

    if (lastIndex < text.length) {
        nodes.push(text.slice(lastIndex));
    }

    return nodes;
}

const HEADING_SIZES = ["text-base", "text-[15px]", "text-sm", "text-sm"];

function isBlockStart(line) {
    return (
        /^```/.test(line) ||
        /^(#{1,4})\s+/.test(line) ||
        /^\s*[-*+]\s+/.test(line) ||
        /^\s*\d+\.\s+/.test(line) ||
        /^>\s?/.test(line)
    );
}

export function renderMarkdown(text) {
    if (!text) return null;

    const clean = String(text).replace(/\\n/g, "\n");
    const lines = clean.split("\n");
    const blocks = [];
    let key = 0;
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        const fence = /^```(\w+)?\s*$/.exec(line);
        if (fence) {
            const code = [];
            i++;
            while (i < lines.length && !/^```\s*$/.test(lines[i])) {
                code.push(lines[i]);
                i++;
            }
            i++; // lewati penutup ```
            blocks.push(
                <pre
                    key={key++}
                    className="my-2 overflow-x-auto rounded-xl bg-gray-900 p-3 text-[12px] leading-relaxed text-gray-100 dark:bg-black/40"
                >
                    <code>{code.join("\n")}</code>
                </pre>
            );
            continue;
        }

        const heading = /^(#{1,4})\s+(.*)$/.exec(line);
        if (heading) {
            const level = heading[1].length;
            blocks.push(
                <p
                    key={key++}
                    className={`mb-0.5 mt-2 font-bold text-gray-900 dark:text-white ${HEADING_SIZES[level - 1]}`}
                >
                    {renderInline(heading[2], `h${key}`)}
                </p>
            );
            i++;
            continue;
        }

        if (/^\s*[-*+]\s+/.test(line)) {
            const items = [];
            while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
                items.push(lines[i].replace(/^\s*[-*+]\s+/, ""));
                i++;
            }
            blocks.push(
                <ul key={key++} className="my-1.5 list-disc space-y-1 pl-5">
                    {items.map((item, idx) => (
                        <li key={idx} className="pl-0.5">
                            {renderInline(item, `ul${key}-${idx}`)}
                        </li>
                    ))}
                </ul>
            );
            continue;
        }

        if (/^\s*\d+\.\s+/.test(line)) {
            const items = [];
            while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
                items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
                i++;
            }
            blocks.push(
                <ol key={key++} className="my-1.5 list-decimal space-y-1 pl-5">
                    {items.map((item, idx) => (
                        <li key={idx} className="pl-0.5">
                            {renderInline(item, `ol${key}-${idx}`)}
                        </li>
                    ))}
                </ol>
            );
            continue;
        }

        if (/^>\s?/.test(line)) {
            const quoted = [];
            while (i < lines.length && /^>\s?/.test(lines[i])) {
                quoted.push(lines[i].replace(/^>\s?/, ""));
                i++;
            }
            blocks.push(
                <blockquote
                    key={key++}
                    className="my-1.5 border-l-2 border-brand-500/40 pl-3 text-gray-600 dark:text-gray-300"
                >
                    {renderInline(quoted.join(" "), `bq${key}`)}
                </blockquote>
            );
            continue;
        }

        if (line.trim() === "") {
            i++;
            continue;
        }

        const paragraph = [];
        while (i < lines.length && lines[i].trim() !== "" && !isBlockStart(lines[i])) {
            paragraph.push(lines[i]);
            i++;
        }
        blocks.push(
            <p key={key++} className="whitespace-pre-wrap">
                {renderInline(paragraph.join("\n"), `p${key}`)}
            </p>
        );
    }

    return blocks;
}

export default function Markdown({ text, className = "" }) {
    return <div className={className}>{renderMarkdown(text)}</div>;
}
