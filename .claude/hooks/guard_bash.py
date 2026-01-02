#!/usr/bin/env python3
"""
Bash command guardrail hook for Claude Code.
Reads stdin JSON and blocks dangerous commands based on policy.
Exit code 2 = block the operation.
"""

import json
import os
import re
import sys
from pathlib import Path


def load_policy():
    """Load the guardrails policy from the project directory."""
    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())
    policy_path = Path(project_dir) / ".claude" / "guardrails.policy.json"

    if not policy_path.exists():
        return None

    with open(policy_path, "r", encoding="utf-8") as f:
        return json.load(f)


def check_command(command: str, policy: dict) -> tuple[bool, str]:
    """
    Check if a command is allowed.
    Returns (allowed, reason).
    """
    bash_policy = policy.get("bash", {})

    # Empty command is always allowed
    if not command or not command.strip():
        return True, ""

    command_lower = command.strip()

    # Check deny_regex first (highest priority)
    deny_patterns = bash_policy.get("deny_regex", [])
    for pattern in deny_patterns:
        try:
            if re.search(pattern, command_lower):
                return False, f"Command blocked by deny pattern: {pattern}"
        except re.error:
            continue

    # Check allowlist if enforced
    if bash_policy.get("enforce_allowlist", False):
        allow_prefixes = bash_policy.get("allow_prefixes", [])
        allowed = False
        for prefix in allow_prefixes:
            if command_lower.startswith(prefix):
                allowed = True
                break

        if not allowed:
            return False, f"Command not in allowlist. Allowed prefixes: {', '.join(allow_prefixes[:5])}..."

    return True, ""


def check_warnings(command: str, policy: dict) -> list[str]:
    """Check for warning patterns and return warning messages."""
    warnings = []
    bash_policy = policy.get("bash", {})
    warn_patterns = bash_policy.get("warn_regex", [])

    for pattern in warn_patterns:
        try:
            if re.search(pattern, command):
                warnings.append(f"Warning: Command matches pattern '{pattern}'")
        except re.error:
            continue

    return warnings


def main():
    # Read stdin JSON
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        # If we can't parse input, allow the operation
        sys.exit(0)

    # Extract command from tool_input
    tool_input = input_data.get("tool_input", {})
    command = tool_input.get("command", "")

    # Load policy
    policy = load_policy()
    if not policy:
        # No policy file = allow everything
        sys.exit(0)

    # Check command
    allowed, reason = check_command(command, policy)

    if not allowed:
        print(f"BLOCKED: {reason}", file=sys.stderr)
        print(f"Attempted command: {command[:100]}...", file=sys.stderr)
        sys.exit(2)

    # Check for warnings (non-blocking)
    warnings = check_warnings(command, policy)
    for warning in warnings:
        print(warning, file=sys.stderr)

    sys.exit(0)


if __name__ == "__main__":
    main()
