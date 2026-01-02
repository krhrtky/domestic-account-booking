#!/usr/bin/env python3
"""
Stop gate hook for Claude Code.
Runs validation commands before allowing session to stop.
Exit code 2 = block (indicates tests/lint failed).
"""

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


def run_command(cmd: str, project_dir: str) -> tuple[bool, str]:
    """
    Run a command and return (success, output).
    """
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            cwd=project_dir,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout for tests
        )

        output = result.stdout + result.stderr
        return result.returncode == 0, output
    except subprocess.TimeoutExpired:
        return False, "Command timed out after 5 minutes"
    except Exception as e:
        return False, str(e)


def check_command_available(cmd: str, project_dir: str) -> bool:
    """Check if a command is available to run."""
    # For npm commands, check package.json
    if cmd.startswith("npm "):
        package_json = Path(project_dir) / "package.json"
        if not package_json.exists():
            return False

        # Check if it's a script command
        if cmd.startswith("npm run "):
            script_name = cmd.replace("npm run ", "").split()[0]
            try:
                with open(package_json, "r") as f:
                    pkg = json.load(f)
                    scripts = pkg.get("scripts", {})
                    return script_name in scripts
            except Exception:
                return False
        elif cmd == "npm test":
            try:
                with open(package_json, "r") as f:
                    pkg = json.load(f)
                    scripts = pkg.get("scripts", {})
                    return "test" in scripts
            except Exception:
                return False

    return True


def main():
    # Read stdin JSON (may contain session info)
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        input_data = {}

    # Load policy
    policy = load_policy()
    if not policy:
        sys.exit(0)

    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())
    quality_config = policy.get("quality", {})
    stop_commands = quality_config.get("stop_gate_commands", [])

    if not stop_commands:
        sys.exit(0)

    failed_commands = []

    for cmd in stop_commands:
        # Skip unavailable commands
        if not check_command_available(cmd, project_dir):
            print(f"Skipping unavailable command: {cmd}", file=sys.stderr)
            continue

        print(f"Running stop gate: {cmd}", file=sys.stderr)
        success, output = run_command(cmd, project_dir)

        if not success:
            failed_commands.append({
                "command": cmd,
                "output": output[:1000] if output else "No output"
            })

    if failed_commands:
        print("\n" + "=" * 50, file=sys.stderr)
        print("STOP GATE FAILED", file=sys.stderr)
        print("=" * 50, file=sys.stderr)

        for failed in failed_commands:
            print(f"\nFailed: {failed['command']}", file=sys.stderr)
            print(f"Output: {failed['output'][:500]}", file=sys.stderr)

        print("\n" + "=" * 50, file=sys.stderr)
        print("NEXT STEPS:", file=sys.stderr)
        print("1. Review the failed command output above", file=sys.stderr)
        print("2. Fix the issues before completing the session", file=sys.stderr)
        print("3. Run the commands manually to verify fixes", file=sys.stderr)
        print("=" * 50, file=sys.stderr)

        sys.exit(2)

    print("All stop gate checks passed", file=sys.stderr)
    sys.exit(0)


if __name__ == "__main__":
    main()
