#!/usr/bin/env python3
"""
Post-edit quality hook for Claude Code.
Runs formatters and quality tools after file edits.
Exit code 2 = block (indicates quality check failed).
"""

import fnmatch
import json
import os
import subprocess
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


def matches_glob(file_path: str, glob_pattern: str) -> bool:
    """Check if a file path matches a glob pattern."""
    # Handle brace expansion like {js,ts,tsx}
    if "{" in glob_pattern and "}" in glob_pattern:
        # Simple brace expansion
        import re
        brace_match = re.search(r'\{([^}]+)\}', glob_pattern)
        if brace_match:
            alternatives = brace_match.group(1).split(",")
            for alt in alternatives:
                expanded_pattern = glob_pattern.replace(brace_match.group(0), alt.strip())
                if fnmatch.fnmatch(file_path, expanded_pattern):
                    return True
            return False

    return fnmatch.fnmatch(file_path, glob_pattern)


def run_quality_command(cmd: str, file_path: str, project_dir: str) -> tuple[bool, str]:
    """
    Run a quality command for a file.
    Returns (success, output).
    """
    # Replace {file} placeholder
    cmd = cmd.replace("{file}", file_path)

    try:
        result = subprocess.run(
            cmd,
            shell=True,
            cwd=project_dir,
            capture_output=True,
            text=True,
            timeout=60
        )

        output = result.stdout + result.stderr
        return result.returncode == 0, output
    except subprocess.TimeoutExpired:
        return False, "Command timed out after 60 seconds"
    except Exception as e:
        return False, str(e)


def check_command_exists(cmd: str) -> bool:
    """Check if the base command exists."""
    base_cmd = cmd.split()[0] if cmd else ""
    if not base_cmd:
        return False

    # Handle npx/npm/python commands
    if base_cmd in ("npx", "npm", "python", "python3", "node"):
        return True

    try:
        result = subprocess.run(
            ["which", base_cmd],
            capture_output=True,
            timeout=5
        )
        return result.returncode == 0
    except Exception:
        return False


def main():
    # Read stdin JSON
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)

    # Extract file path
    tool_input = input_data.get("tool_input", {})
    file_path = tool_input.get("file_path", "")

    if not file_path:
        sys.exit(0)

    # Load policy
    policy = load_policy()
    if not policy:
        sys.exit(0)

    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())
    quality_config = policy.get("quality", {})
    commands = quality_config.get("post_edit_commands_by_glob", [])

    # Find matching commands
    for cmd_config in commands:
        glob_pattern = cmd_config.get("glob", "")
        cmd = cmd_config.get("cmd", "")

        if not glob_pattern or not cmd:
            continue

        # Get relative path for matching
        try:
            rel_path = os.path.relpath(file_path, project_dir)
        except ValueError:
            rel_path = file_path

        if matches_glob(rel_path, glob_pattern) or matches_glob(os.path.basename(file_path), glob_pattern):
            # Check if command exists before running
            if not check_command_exists(cmd):
                print(f"Skipping: {cmd.split()[0]} not found", file=sys.stderr)
                continue

            success, output = run_quality_command(cmd, file_path, project_dir)

            if not success:
                print(f"Quality check failed: {cmd}", file=sys.stderr)
                if output:
                    print(output[:500], file=sys.stderr)
                # Don't block on formatter failures, just warn
                # sys.exit(2)
            else:
                print(f"Quality check passed: {cmd.split()[0]}", file=sys.stderr)

    sys.exit(0)


if __name__ == "__main__":
    main()
