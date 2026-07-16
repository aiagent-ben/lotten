"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { forwardRef, useImperativeHandle, useRef } from "react";
import DOMPurify from "dompurify";

export interface RichTextEditorRef {
  getHTML: () => string;
  getText: () => string;
  setContent: (content: string) => boolean | undefined;
  focus: () => boolean | undefined;
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ value, onChange, placeholder = "Write description...", className = "", readOnly = false }, ref) => {
    const editorRef = useRef<ReturnType<typeof useEditor> | null>(null);
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [3, 4] },
        }),
        Placeholder.configure({ placeholder }),
        Link.configure({ openOnClick: false }),
        Image.configure({ inline: true }),
        Underline,
        TextStyle,
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        TaskList,
        TaskItem.configure({ nested: true }),
      ],
      content: value,
      editable: !readOnly,
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        const sanitized = DOMPurify.sanitize(html, {
          ALLOWED_TAGS: [
            "p", "br", "strong", "em", "u", "s", "a", "ul", "ol", "li",
            "h3", "h4", "blockquote", "code", "pre", "img", "div", "span",
            "tasklist", "taskitem",
          ],
          ALLOWED_ATTR: ["href", "src", "alt", "title", "style", "class", "data-type", "checked"],
        });
        onChange(sanitized);
      },
      editorProps: {
        attributes: {
          class: `prose prose-sm max-w-none focus:outline-none min-h-[200px] ${className}`,
          spellcheck: "true",
        },
      },
    });

    useImperativeHandle(ref, () => ({
      getHTML: () => editor?.getHTML() || "",
      getText: () => editor?.getText() || "",
      setContent: (content: string) => editor?.commands.setContent(content),
      focus: () => editor?.commands.focus(),
    }), []);

    if (!editor) {
      return <div className={`min-h-[200px] ${className}`} data-tiptap-editor />;
    }

    return (
      <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
        <div className="flex border-b border-gray-200 bg-gray-50 px-3 py-2 gap-1">
          <div className="flex gap-1" role="toolbar">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className="px-2 py-1 text-sm hover:bg-gray-100 rounded"
              title="Heading 3"
            >
              H3
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
              className="px-2 py-1 text-sm hover:bg-gray-100 rounded"
              title="Heading 4"
            >
              H4
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className="px-2 py-1 text-sm font-bold hover:bg-gray-100 rounded"
              title="Bold (Ctrl+B)"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className="px-2 py-1 text-sm italic hover:bg-gray-100 rounded"
              title="Italic (Ctrl+I)"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className="px-2 py-1 text-sm underline hover:bg-gray-100 rounded"
              title="Underline (Ctrl+U)"
            >
              U
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className="px-2 py-1 text-sm line-through hover:bg-gray-100 rounded"
              title="Strikethrough"
            >
              S
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className="px-2 py-1 text-sm hover:bg-gray-100 rounded"
              title="Bullet List"
            >
              •
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className="px-2 py-1 text-sm hover:bg-gray-100 rounded"
              title="Numbered List"
            >
              1.
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className="px-2 py-1 text-sm hover:bg-gray-100 rounded"
              title="Task List"
            >
              ☐
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              className="px-2 py-1 hover:bg-gray-100 rounded"
              title="Align Left"
            >
              ⬅
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              className="px-2 py-1 hover:bg-gray-100 rounded"
              title="Align Center"
            >
              ⬛
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              className="px-2 py-1 hover:bg-gray-100 rounded"
              title="Align Right"
            >
              ➡
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className="px-2 py-1 text-sm font-mono hover:bg-gray-100 rounded"
              title="Inline Code"
            >
              {}
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className="px-2 py-1 text-sm font-mono hover:bg-gray-100 rounded"
              title="Code Block"
            >
              [ ]
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <button
              type="button"
              onClick={() => {
                const url = window.prompt("Enter URL:");
                if (url) editor.chain().focus().setLink({ href: url }).run();
              }}
              className="px-2 py-1 text-sm hover:bg-gray-100 rounded"
              title="Add Link"
            >
              🔗
            </button>
            <button
              type="button"
              onClick={() => {
                const url = window.prompt("Enter image URL:");
                if (url) editor.chain().focus().setImage({ src: url }).run();
              }}
              className="px-2 py-1 text-sm hover:bg-gray-100 rounded"
              title="Add Image"
            >
              🖼
            </button>
          </div>
        </div>
        <EditorContent editor={editor} />
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;