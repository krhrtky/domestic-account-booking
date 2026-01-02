#!/usr/bin/env python3
"""
WebFetch guardrail hook for Claude Code.
Blocks unauthorized domain access based on policy.
Exit code 2 = block the operation.
"""

import json
import os
import sys
from pathlib import Path
from urllib.parse import urlparse


def load_policy():
    """Load the guardrails policy from the project directory."""
    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())
    policy_path = Path(project_dir) / ".claude" / "guardrails.policy.json"

    if not policy_path.exists():
        return None

    with open(policy_path, "r", encoding="utf-8") as f:
        return json.load(f)


def extract_domain(url: str) -> str:
    """Extract domain from URL."""
    try:
        parsed = urlparse(url)
        return parsed.netloc.lower()
    except Exception:
        return ""


def domain_matches(domain: str, allowed_domain: str) -> bool:
    """
    Check if domain matches an allowed domain.
    Supports exact match and subdomain matching.
    """
    domain = domain.lower()
    allowed_domain = allowed_domain.lower()

    # Exact match
    if domain == allowed_domain:
        return True

    # Subdomain match (e.g., www.example.com matches example.com)
    if domain.endswith("." + allowed_domain):
        return True

    return False


def check_url(url: str, policy: dict) -> tuple[bool, str]:
    """
    Check if URL fetch is allowed.
    Returns (allowed, reason).
    """
    webfetch_policy = policy.get("webfetch", {})

    if not url:
        return True, ""

    domain = extract_domain(url)
    if not domain:
        return False, "Could not extract domain from URL"

    # Check deny list first (highest priority)
    deny_domains = webfetch_policy.get("deny_domains", [])
    for denied in deny_domains:
        if domain_matches(domain, denied):
            return False, f"Domain '{domain}' is in deny list"

    # Check allowlist if enforced
    if webfetch_policy.get("enforce_allowlist", False):
        allow_domains = webfetch_policy.get("allow_domains", [])
        allowed = False
        for allowed_domain in allow_domains:
            if domain_matches(domain, allowed_domain):
                allowed = True
                break

        if not allowed:
            return False, f"Domain '{domain}' is not in allow list. Allowed: {', '.join(allow_domains)}"

    return True, ""


def main():
    # Read stdin JSON
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)

    # Extract URL from tool_input
    tool_input = input_data.get("tool_input", {})
    url = tool_input.get("url", "")

    # Load policy
    policy = load_policy()
    if not policy:
        sys.exit(0)

    # Check URL
    allowed, reason = check_url(url, policy)

    if not allowed:
        print(f"BLOCKED: {reason}", file=sys.stderr)
        print(f"Attempted URL: {url}", file=sys.stderr)
        sys.exit(2)

    sys.exit(0)


if __name__ == "__main__":
    main()
