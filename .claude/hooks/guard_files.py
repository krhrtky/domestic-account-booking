#!/usr/bin/env python3
"""
File access guardrail hook for Claude Code.
Blocks access to sensitive files based on policy.
Exit code 2 = block the operation.
"""

import fnmatch
import json
import os
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


def normalize_path(file_path: str, project_dir: str) -> str:
    """Normalize a file path for matching against globs."""
    # Expand home directory
    if file_path.startswith("~"):
        file_path = os.path.expanduser(file_path)

    # Make path absolute if relative
    if not os.path.isabs(file_path):
        file_path = os.path.join(project_dir, file_path)

    # Normalize
    return os.path.normpath(file_path)


def matches_glob(file_path: str, glob_pattern: str, project_dir: str) -> bool:
    """Check if a file path matches a glob pattern."""
    # Handle ~ patterns
    if glob_pattern.startswith("~"):
        glob_pattern = os.path.expanduser(glob_pattern)
    elif glob_pattern.startswith("./"):
        glob_pattern = os.path.join(project_dir, glob_pattern[2:])
    elif not os.path.isabs(glob_pattern):
        glob_pattern = os.path.join(project_dir, glob_pattern)

    glob_pattern = os.path.normpath(glob_pattern)

    # Use fnmatch for glob matching
    return fnmatch.fnmatch(file_path, glob_pattern)


def check_file_access(file_path: str, tool_name: str, policy: dict) -> tuple[bool, str]:
    """
    Check if file access is allowed.
    Returns (allowed, reason).
    """
    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())
    paths_policy = policy.get("paths", {})

    if not file_path:
        return True, ""

    normalized_path = normalize_path(file_path, project_dir)

    # Check read denials for Read operations
    if tool_name.lower() == "read":
        deny_read_globs = paths_policy.get("deny_read_globs", [])
        for glob_pattern in deny_read_globs:
            if matches_glob(normalized_path, glob_pattern, project_dir):
                return False, f"File read blocked by policy: {glob_pattern}"

    # Check edit denials for Edit/Write operations
    if tool_name.lower() in ("edit", "write"):
        deny_edit_globs = paths_policy.get("deny_edit_globs", [])
        for glob_pattern in deny_edit_globs:
            if matches_glob(normalized_path, glob_pattern, project_dir):
                return False, f"File edit blocked by policy: {glob_pattern}"

        # Also check read denials for edit (can't edit what you can't read)
        deny_read_globs = paths_policy.get("deny_read_globs", [])
        for glob_pattern in deny_read_globs:
            if matches_glob(normalized_path, glob_pattern, project_dir):
                return False, f"File edit blocked (read denied): {glob_pattern}"

    return True, ""


def main():
    # Read stdin JSON
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)

    # Extract file path and tool name
    tool_input = input_data.get("tool_input", {})
    tool_name = input_data.get("tool_name", "")
    file_path = tool_input.get("file_path", "")

    # Also check 'path' field (some tools use this)
    if not file_path:
        file_path = tool_input.get("path", "")

    # Load policy
    policy = load_policy()
    if not policy:
        sys.exit(0)

    # Check file access
    allowed, reason = check_file_access(file_path, tool_name, policy)

    if not allowed:
        print(f"BLOCKED: {reason}", file=sys.stderr)
        print(f"Attempted path: {file_path}", file=sys.stderr)
        sys.exit(2)

    sys.exit(0)


if __name__ == "__main__":
    main()
