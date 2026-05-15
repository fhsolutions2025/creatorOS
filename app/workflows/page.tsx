"use client";

import { useState } from "react";
import {
  FileText, Clock, Webhook, Mail, Bell, Sheet, Globe,
  Sparkles, Loader2, Play, X, ChevronRight, CheckCircle, AlertCircle
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type NodeKind = "trigger" | "action";

interface NodeDef {
  id: string;
  kind: NodeKind;
  label: string;
  description: string;
  icon: React.ElementType;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
}

interface WorkflowNode extends NodeDef {
  config: Record<string, string>;
}

interface RunLog {
  step: string;
  status: "ok" | "error" | "info";
  message: string;
}

// ─── Node Definitions ─────────────────────────────────────────────────────────

const TRIGGERS: NodeDef[] = [
  {
    id: "form_submitted", kind: "trigger", label: "Form Submitted", description: "Fires when a form is submitted",
    icon: FileText,
    fields: [{ key: "formId", label: "Form ID", placeholder: "contact-form" }],
  },
  {
    id: "schedule", kind: "trigger", label: "Schedule", description: "Runs on a cron schedule",
    icon: Clock,
    fields: [{ key: "cron", label: "Cron expression", placeholder: "0 9 * * 1-5" }],
  },
  {
    id: "webhook", kind: "trigger", label: "Webhook", description: "Fires on incoming HTTP request",
    icon: Webhook,
    fields: [{ key: "secret", label: "Webhook secret", placeholder: "my-secret" }],
  },
];

const ACTIONS: NodeDef[] = [
  {
    id: "send_email", kind: "action", label: "Send Email", description: "Send an email message",
    icon: Mail,
    fields: [
      { key: "to", label: "To address", placeholder: "user@example.com" },
      { key: "subject", label: "Subject", placeholder: "Hello!" },
      { key: "body", label: "Body", placeholder: "Email content…" },
    ],
  },
  {
    id: "notify_slack", kind: "action", label: "Notify Slack", description: "Post to a Slack channel",
    icon: Bell,
    fields: [
      { key: "webhookUrl", label: "Webhook URL", placeholder: "https://hooks.slack.com/…" },
      { key: "message", label: "Message", placeholder: "Workflow triggered!" },
    ],
  },
  {
    id: "save_to_sheet", kind: "action", label: "Save to Sheet", description: "Append a row to Google Sheets",
    icon: Sheet,
    fields: [
      { key: "sheetId", label: "Sheet ID", placeholder: "1BxiM…" },
      { key: "data", label: "Data (JSON)", placeholder: '{"name":"value"}' },
    ],
  },
  {
    id: "http_request", kind: "action", label: "HTTP Request", description: "Make an outbound HTTP call",
    icon: Globe,
    fields: [
      { key: "url", label: "URL", placeholder: "https://api.example.com/hook" },
      { key: "method", label: "Method", placeholder: "POST" },
      { key: "body", label: "Body (JSON)", placeholder: '{"key":"value"}' },
    ],
  },
];

// ─── Small helpers ─────────────────────────────────────────────────────────────

const statusIcon = (status: RunLog["status"]) => {
  if (status === "ok") return <CheckCircle size={13} className="text-emerald-500 shrink-0" />;
  if (status === "error") return <AlertCircle size={13} className="text-red-500 shrink-0" />;
  return <span className="w-3 h-3 rounded-full bg-indigo-400 shrink-0 inline-block" />;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WorkflowsPage() {
  const [trigger, setTrigger] = useState<WorkflowNode | null>(null);
  const [actions, setActions] = useState<WorkflowNode[]>([]);
  const [selected, setSelected] = useState<WorkflowNode | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDescription, setAiDescription] = useState<string | null>(null);
  const [runLogs, setRunLogs] = useState<RunLog[] | null>(null);
  const [runLoading, setRunLoading] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const addTrigger = (def: NodeDef) => {
    const node: WorkflowNode = { ...def, config: Object.fromEntries(def.fields.map((f) => [f.key, ""])) };
    setTrigger(node);
    setSelected(node);
  };

  const addAction = (def: NodeDef) => {
    const node: WorkflowNode = { ...def, config: Object.fromEntries(def.fields.map((f) => [f.key, ""])) };
    setActions((prev) => [...prev, node]);
    setSelected(node);
  };

  const updateConfig = (key: string, value: string) => {
    if (!selected) return;
    const updated = { ...selected, config: { ...selected.config, [key]: value } };
    setSelected(updated);
    if (selected.kind === "trigger") {
      setTrigger(updated);
    } else {
      setActions((prev) => prev.map((a) => (a.id === selected.id && a === selected ? updated : a)));
    }
  };

  const removeAction = (index: number) => {
    const next = actions.filter((_, i) => i !== index);
    setActions(next);
    if (selected && actions[index] === selected) setSelected(null);
  };

  const handleAiDescribe = async () => {
    setAiLoading(true);
    setAiDescription(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "workflow_describe",
          context: {
            trigger: trigger?.label ?? "none",
            actions: actions.map((a) => a.label),
          },
        }),
      });
      const data = await res.json();
      setAiDescription(data.result ?? "No description returned.");
    } catch {
      setAiDescription("Failed to get AI description.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleRunTest = async () => {
    setRunLoading(true);
    setRunLogs(null);
    try {
      const res = await fetch("/api/workflow-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trigger: trigger ? { id: trigger.id, label: trigger.label, config: trigger.config } : null,
          actions: actions.map((a) => ({ id: a.id, label: a.label, config: a.config })),
        }),
      });
      const data = await res.json();
      setRunLogs(data.log ?? []);
      setShowLogs(true);
    } catch {
      setRunLogs([{ step: "Runner", status: "error", message: "Failed to reach /api/workflow-test" }]);
      setShowLogs(true);
    } finally {
      setRunLoading(false);
    }
  };

  const totalNodes = (trigger ? 1 : 0) + actions.length;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Node Library */}
      <aside className="w-52 shrink-0 border-r border-gray-100 bg-gray-50 flex flex-col overflow-auto">
        <div className="px-4 py-4 border-b border-gray-100">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Triggers</h2>
        </div>
        <div className="p-3 space-y-1.5">
          {TRIGGERS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => addTrigger(t)}
                className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors group ${
                  trigger?.id === t.id
                    ? "border-indigo-300 bg-indigo-50"
                    : "border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50"
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <Icon size={13} className={trigger?.id === t.id ? "text-indigo-500" : "text-gray-400 group-hover:text-indigo-400"} />
                  <span className={`text-sm font-medium ${trigger?.id === t.id ? "text-indigo-700" : "text-gray-800"}`}>{t.label}</span>
                </div>
                <p className="text-xs text-gray-400 ml-5">{t.description}</p>
              </button>
            );
          })}
        </div>

        <div className="px-4 py-3 border-t border-b border-gray-100">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</h2>
        </div>
        <div className="p-3 space-y-1.5 flex-1">
          {ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.id}
                onClick={() => addAction(a)}
                className="w-full text-left rounded-lg border border-gray-200 bg-white px-3 py-2.5 hover:border-indigo-200 hover:bg-indigo-50 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <Icon size={13} className="text-gray-400 group-hover:text-indigo-400" />
                  <span className="text-sm font-medium text-gray-800 group-hover:text-indigo-700">{a.label}</span>
                </div>
                <p className="text-xs text-gray-400 ml-5">{a.description}</p>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Center: Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-white">
          <h1 className="text-sm font-semibold text-gray-700">Workflow Canvas</h1>
          <button
            onClick={handleRunTest}
            disabled={runLoading || totalNodes === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: "#6366f1" }}
          >
            {runLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {runLoading ? "Running…" : "Run Test"}
          </button>
        </div>

        {/* Flow canvas */}
        <div className="flex-1 overflow-auto p-8 flex flex-col items-center" style={{ backgroundColor: "#fafafa" }}>
          {totalNodes === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center mb-3">
                <ChevronRight size={24} style={{ color: "#6366f1" }} />
              </div>
              <p className="text-sm text-gray-400 max-w-xs">
                Pick a trigger and add actions from the left panel to build your workflow
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-0 w-full max-w-sm">
              {/* Trigger Node */}
              {trigger && (
                <div
                  onClick={() => setSelected(trigger)}
                  className={`w-full rounded-xl border-2 bg-white px-5 py-4 cursor-pointer transition-all shadow-sm ${
                    selected === trigger ? "border-indigo-400 shadow-md" : "border-gray-200 hover:border-indigo-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#eef2ff" }}>
                      <trigger.icon size={15} style={{ color: "#6366f1" }} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">TRIGGER</p>
                      <p className="text-sm font-semibold text-gray-800">{trigger.label}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action nodes */}
              {actions.map((action, i) => (
                <div key={`${action.id}-${i}`} className="flex flex-col items-center w-full">
                  {/* Arrow */}
                  <div className="flex flex-col items-center py-1">
                    <div className="w-px h-5 bg-gray-300" />
                    <ChevronRight size={12} className="text-gray-400 -rotate-90 -mt-1" />
                  </div>
                  {/* Node */}
                  <div
                    onClick={() => setSelected(action)}
                    className={`w-full rounded-xl border-2 bg-white px-5 py-4 cursor-pointer transition-all shadow-sm ${
                      selected === action ? "border-indigo-400 shadow-md" : "border-gray-200 hover:border-indigo-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-50">
                          <action.icon size={15} className="text-gray-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">ACTION {i + 1}</p>
                          <p className="text-sm font-semibold text-gray-800">{action.label}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeAction(i); }}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Config Panel */}
      <aside className="w-64 shrink-0 border-l border-gray-100 bg-white flex flex-col">
        <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Configure</h2>
        </div>

        {selected ? (
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {/* AI Describe */}
            <button
              onClick={handleAiDescribe}
              disabled={aiLoading}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: "#6366f1" }}
            >
              {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {aiLoading ? "Thinking…" : "AI Describe"}
            </button>

            {aiDescription && (
              <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3 text-xs text-indigo-700 leading-relaxed">
                {aiDescription}
              </div>
            )}

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-700 mb-3">{selected.label}</p>
              <div className="space-y-3">
                {selected.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{field.label}</label>
                    <input
                      type={field.type ?? "text"}
                      placeholder={field.placeholder}
                      value={selected.config[field.key] ?? ""}
                      onChange={(e) => updateConfig(field.key, e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <p className="text-sm text-gray-400">Select a node on the canvas to configure it</p>
          </div>
        )}
      </aside>

      {/* Run Log Modal */}
      {showLogs && runLogs && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Test Run Log</h3>
              <button onClick={() => setShowLogs(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-2 max-h-72 overflow-auto font-mono text-xs">
              {runLogs.map((log, i) => (
                <div key={i} className="flex items-start gap-2">
                  {statusIcon(log.status)}
                  <span className="text-gray-500 shrink-0">[{log.step}]</span>
                  <span className={log.status === "error" ? "text-red-600" : "text-gray-700"}>{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
