#!/usr/bin/env python3
"""
Audit logging hook for Claude Code.
Logs all tool calls to a JSONL file.
Always exits 0 (never blocks).
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path


def load_policy():
    """Load the guardrails policy from the project directory."""
    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())
    policy_path = Path(project_dir) / ".claude" / "guardrails.policy.json"

    if not policy_path.exists():
        return None

    with open(policy_path, "r", encoding="utf-8") as f:
        return json.load(f)


def get_log_path(policy: dict) -> Path:
    """Get the audit log path from policy."""
    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())

    if policy:
        audit_config = policy.get("audit", {})
        log_path = audit_config.get("log_path", ".claude/audit/tool_calls.jsonl")
    else:
        log_path = ".claude/audit/tool_calls.jsonl"

    return Path(project_dir) / log_path


def main():
    # Read stdin JSON
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)

    # Load policy
    policy = load_policy()
    log_path = get_log_path(policy)

    # Ensure directory exists
    log_path.parent.mkdir(parents=True, exist_ok=True)

    # Add timestamp to the log entry
    log_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "tool_name": input_data.get("tool_name", "unknown"),
        "tool_input": input_data.get("tool_input", {}),
        "session_id": input_data.get("session_id", ""),
    }

    # Append to log file
    try:
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")
    except Exception as e:
        # Log errors to stderr but don't block
        print(f"Warning: Could not write audit log: {e}", file=sys.stderr)

    # Always allow (audit is passive)
    sys.exit(0)


if __name__ == "__main__":
    main()
