"use client";

import { useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus, GripVertical, X, Eye, Sparkles, Loader2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type BlockType = "hero" | "features" | "pricing" | "contact" | "text" | "image";

interface Block {
  id: string;
  type: BlockType;
  content: Record<string, string>;
}

// ─── Block library config ─────────────────────────────────────────────────────

const BLOCK_LIBRARY: { type: BlockType; label: string; description: string }[] = [
  { type: "hero", label: "Hero", description: "Bold headline + CTA" },
  { type: "features", label: "Features", description: "3-column feature grid" },
  { type: "pricing", label: "Pricing", description: "Pricing tiers" },
  { type: "contact", label: "Contact Form", description: "Lead capture form" },
  { type: "text", label: "Text", description: "Rich text section" },
  { type: "image", label: "Image", description: "Full-width image block" },
];

const DEFAULT_CONTENT: Record<BlockType, Record<string, string>> = {
  hero: { headline: "Welcome to our product", subheadline: "The best solution for your needs", cta: "Get Started" },
  features: { title: "Features", feature1: "Fast & Reliable", feature2: "Easy to Use", feature3: "Powerful Tools" },
  pricing: { title: "Simple Pricing", plan1: "Starter — $9/mo", plan2: "Pro — $29/mo", plan3: "Enterprise — Custom" },
  contact: { title: "Get in Touch", placeholder: "Your email address", button: "Send Message" },
  text: { heading: "About Us", body: "We are a team of passionate builders dedicated to creating great products." },
  image: { src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80", alt: "Hero image" },
};

// ─── Block Renderers ──────────────────────────────────────────────────────────

function BlockPreview({ block }: { block: Block }) {
  const c = block.content;
  switch (block.type) {
    case "hero":
      return (
        <div className="bg-indigo-50 rounded-xl p-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{c.headline}</h1>
          <p className="text-gray-600 mb-6">{c.subheadline}</p>
          <button className="px-6 py-2.5 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: "#6366f1" }}>
            {c.cta}
          </button>
        </div>
      );
    case "features":
      return (
        <div className="py-8 px-4">
          <h2 className="text-xl font-bold text-center text-gray-900 mb-6">{c.title}</h2>
          <div className="grid grid-cols-3 gap-4">
            {[c.feature1, c.feature2, c.feature3].map((f, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4 text-center text-sm font-medium text-gray-700">{f}</div>
            ))}
          </div>
        </div>
      );
    case "pricing":
      return (
        <div className="py-8 px-4">
          <h2 className="text-xl font-bold text-center text-gray-900 mb-6">{c.title}</h2>
          <div className="grid grid-cols-3 gap-3">
            {[c.plan1, c.plan2, c.plan3].map((p, i) => (
              <div key={i} className={`rounded-lg p-4 text-center text-sm ${i === 1 ? "text-white" : "bg-gray-50 text-gray-700"}`}
                style={i === 1 ? { backgroundColor: "#6366f1" } : {}}>
                {p}
              </div>
            ))}
          </div>
        </div>
      );
    case "contact":
      return (
        <div className="py-8 px-4 max-w-sm mx-auto text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{c.title}</h2>
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" placeholder={c.placeholder} readOnly />
          <button className="w-full py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: "#6366f1" }}>{c.button}</button>
        </div>
      );
    case "text":
      return (
        <div className="py-8 px-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">{c.heading}</h2>
          <p className="text-gray-600 leading-relaxed">{c.body}</p>
        </div>
      );
    case "image":
      return (
        <div className="overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.src} alt={c.alt} className="w-full h-48 object-cover" />
        </div>
      );
    default:
      return null;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BuilderPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const selectedBlock = blocks.find((b) => b.id === selectedId) ?? null;

  const addBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: `${type}-${Date.now()}`,
      type,
      content: { ...DEFAULT_CONTENT[type] },
    };
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedId(newBlock.id);
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const updateContent = (key: string, value: string) => {
    if (!selectedId) return;
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === selectedId ? { ...b, content: { ...b.content, [key]: value } } : b
      )
    );
  };

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(blocks);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setBlocks(items);
  }, [blocks]);

  const handleAiFill = async () => {
    if (!selectedBlock) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "block_fill", context: selectedBlock.type }),
      });
      const data = await res.json();
      if (data.result) {
        try {
          const parsed = JSON.parse(data.result);
          setBlocks((prev) =>
            prev.map((b) =>
              b.id === selectedId ? { ...b, content: { ...b.content, ...parsed } } : b
            )
          );
        } catch {
          // If not JSON, put in first text field
          const firstKey = Object.keys(selectedBlock.content)[0];
          updateContent(firstKey, data.result);
        }
      }
    } catch (err) {
      console.error("AI fill error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Block Library */}
      <aside className="w-52 shrink-0 border-r border-gray-100 bg-gray-50 flex flex-col">
        <div className="px-4 py-4 border-b border-gray-100">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Blocks</h2>
        </div>
        <div className="flex-1 overflow-auto p-3 space-y-1.5">
          {BLOCK_LIBRARY.map((item) => (
            <button
              key={item.type}
              onClick={() => addBlock(item.type)}
              className="w-full text-left rounded-lg border border-gray-200 bg-white px-3 py-3 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm font-medium text-gray-800 group-hover:text-indigo-700">{item.label}</span>
                <Plus size={13} className="text-gray-400 group-hover:text-indigo-500" />
              </div>
              <p className="text-xs text-gray-400">{item.description}</p>
            </button>
          ))}
        </div>
      </aside>

      {/* Center: Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-white">
          <h1 className="text-sm font-semibold text-gray-700">Website Builder</h1>
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#6366f1" }}
          >
            <Eye size={14} />
            Preview
          </button>
        </div>

        {/* Drop zone */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="canvas">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex-1 overflow-auto p-6 space-y-3"
                style={{ backgroundColor: "#fafafa" }}
              >
                {blocks.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center mb-3">
                      <Plus size={24} style={{ color: "#6366f1" }} />
                    </div>
                    <p className="text-sm text-gray-400">Click blocks from the left panel to add them here</p>
                  </div>
                )}
                {blocks.map((block, index) => (
                  <Draggable key={block.id} draggableId={block.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        onClick={() => setSelectedId(block.id)}
                        className={`relative bg-white rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
                          selectedId === block.id ? "border-indigo-400 shadow-md" : "border-gray-100 hover:border-gray-200"
                        } ${snapshot.isDragging ? "shadow-xl rotate-1" : ""}`}
                      >
                        {/* Drag handle */}
                        <div
                          {...provided.dragHandleProps}
                          className="absolute top-2 left-2 z-10 p-1 rounded bg-white/80 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <GripVertical size={14} />
                        </div>
                        {/* Remove btn */}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                          className="absolute top-2 right-2 z-10 p-1 rounded bg-white/80 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                        {/* Block label */}
                        <div className="absolute top-2 left-9 z-10">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                            {block.type}
                          </span>
                        </div>
                        {/* Block content */}
                        <div className="mt-8 px-3 pb-3">
                          <BlockPreview block={block} />
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Right: Editor Panel */}
      <aside className="w-64 shrink-0 border-l border-gray-100 bg-white flex flex-col">
        <div className="px-4 py-4 border-b border-gray-100">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Edit Block</h2>
        </div>

        {selectedBlock ? (
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {/* AI Fill */}
            <button
              onClick={handleAiFill}
              disabled={aiLoading}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: "#6366f1" }}
            >
              {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {aiLoading ? "Generating…" : "AI Fill"}
            </button>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              {Object.entries(selectedBlock.content).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">
                    {key.replace(/([A-Z])/g, " $1").replace(/\d+$/, (n) => ` ${n}`)}
                  </label>
                  {key === "body" || key === "description" ? (
                    <textarea
                      rows={3}
                      value={value}
                      onChange={(e) => updateContent(key, e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateContent(key, e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <p className="text-sm text-gray-400">Select a block on the canvas to edit its content</p>
          </div>
        )}
      </aside>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Page Preview</h3>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-4 bg-white">
              {blocks.length === 0 ? (
                <p className="text-center text-gray-400 py-10">No blocks added yet.</p>
              ) : (
                blocks.map((block) => (
                  <div key={block.id}>
                    <BlockPreview block={block} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
