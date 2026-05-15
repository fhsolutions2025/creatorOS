import { NextRequest, NextResponse } from "next/server";

interface NodeConfig {
  id: string;
  label: string;
  config: Record<string, string>;
}

interface RunLog {
  step: string;
  status: "ok" | "error" | "info";
  message: string;
}

function simulateNode(node: NodeConfig, kind: "trigger" | "action"): RunLog[] {
  const logs: RunLog[] = [];
  const ts = new Date().toISOString();

  if (kind === "trigger") {
    logs.push({ step: "Trigger", status: "info", message: `Checking trigger: ${node.label}` });

    switch (node.id) {
      case "form_submitted":
        logs.push({ step: "Trigger", status: "ok", message: `Form "${node.config.formId || "contact-form"}" received a new submission at ${ts}` });
        break;
      case "schedule":
        logs.push({ step: "Trigger", status: "ok", message: `Cron schedule "${node.config.cron || "* * * * *"}" fired at ${ts}` });
        break;
      case "webhook":
        logs.push({ step: "Trigger", status: "ok", message: `Incoming webhook received (secret validated) at ${ts}` });
        break;
      default:
        logs.push({ step: "Trigger", status: "ok", message: `Trigger "${node.label}" fired at ${ts}` });
    }
  } else {
    logs.push({ step: node.label, status: "info", message: `Executing action: ${node.label}` });

    switch (node.id) {
      case "send_email":
        if (!node.config.to) {
          logs.push({ step: node.label, status: "error", message: "Missing required field: email address (to)" });
        } else {
          logs.push({ step: node.label, status: "ok", message: `Email sent to ${node.config.to} with subject "${node.config.subject || "(no subject)"}"` });
        }
        break;
      case "notify_slack":
        if (!node.config.webhookUrl) {
          logs.push({ step: node.label, status: "error", message: "Missing required field: Slack webhook URL" });
        } else {
          logs.push({ step: node.label, status: "ok", message: `Slack message posted: "${node.config.message || "(empty message)"}"` });
        }
        break;
      case "save_to_sheet":
        if (!node.config.sheetId) {
          logs.push({ step: node.label, status: "error", message: "Missing required field: Google Sheet ID" });
        } else {
          logs.push({ step: node.label, status: "ok", message: `Row appended to sheet ${node.config.sheetId} with data: ${node.config.data || "{}"}` });
        }
        break;
      case "http_request":
        if (!node.config.url) {
          logs.push({ step: node.label, status: "error", message: "Missing required field: URL" });
        } else {
          const method = node.config.method || "POST";
          logs.push({ step: node.label, status: "ok", message: `${method} ${node.config.url} → 200 OK (simulated)` });
        }
        break;
      default:
        logs.push({ step: node.label, status: "ok", message: `Action "${node.label}" executed successfully` });
    }
  }

  return logs;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { trigger, actions } = body as {
      trigger: NodeConfig | null;
      actions: NodeConfig[];
    };

    const log: RunLog[] = [];

    log.push({
      step: "Runner",
      status: "info",
      message: `Starting workflow test run at ${new Date().toISOString()}`,
    });

    if (!trigger) {
      log.push({
        step: "Runner",
        status: "error",
        message: "No trigger configured — add a trigger node to start the workflow",
      });
      return NextResponse.json({ log });
    }

    // Simulate trigger
    const triggerLogs = simulateNode(trigger, "trigger");
    log.push(...triggerLogs);

    // Check if trigger errored
    const triggerErrored = triggerLogs.some((l) => l.status === "error");
    if (triggerErrored) {
      log.push({
        step: "Runner",
        status: "error",
        message: "Workflow halted: trigger failed",
      });
      return NextResponse.json({ log });
    }

    if (!actions || actions.length === 0) {
      log.push({
        step: "Runner",
        status: "info",
        message: "No actions configured — add action nodes to complete the workflow",
      });
    } else {
      // Simulate each action
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        const actionLogs = simulateNode(action, "action");
        log.push(...actionLogs);

        // Stop on error
        if (actionLogs.some((l) => l.status === "error")) {
          log.push({
            step: "Runner",
            status: "error",
            message: `Workflow halted at step ${i + 1}: ${action.label}`,
          });
          return NextResponse.json({ log });
        }

        // Simulate small delay between steps
        log.push({
          step: "Runner",
          status: "info",
          message: `Step ${i + 1}/${actions.length} complete`,
        });
      }
    }

    log.push({
      step: "Runner",
      status: "ok",
      message: `Workflow test completed successfully — ${actions.length} action${actions.length !== 1 ? "s" : ""} executed`,
    });

    return NextResponse.json({ log });
  } catch (error) {
    console.error("Workflow test error:", error);
    return NextResponse.json(
      { log: [{ step: "Runner", status: "error", message: "Internal server error" }] },
      { status: 500 }
    );
  }
}
