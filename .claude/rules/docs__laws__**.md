# Laws Document Protection Rules

This rule applies to all files in `docs/laws/**`.

## L-OC-005: Rule Document Protection

**THIS DIRECTORY IS PROTECTED FROM CODING AGENT EDITS**

### Prohibited Actions

1. **Creating** new files in docs/laws/
2. **Editing** existing files in docs/laws/
3. **Deleting** files from docs/laws/
4. **Renaming** files in docs/laws/

### Required Actions

When encountering rule-related issues, **STOP implementation** and report to user:

#### 1. Rule Conflict
Multiple rules give contradicting instructions.
```
Example: L-CX-001 says "round half up" but L-RV-002 says "round down"
```

#### 2. Rule Absence
A decision is needed but no rule is defined.
```
Example: Security requirements for a new feature are undefined
```

#### 3. Rule Inapplicability
A rule's conditions cannot be met with current implementation.
```
Example: Library limitations prevent rule compliance
```

### Report Format

```markdown
⚠️ Rule Issue Detected

Type: [Conflict | Absence | Inapplicable]
Related Rule: L-XX-NNN
Situation: [Specific explanation]
Impact: [Impact on implementation]
Proposal: [Resolution suggestion if possible]
```

### Who Can Edit

Only **human users** can modify docs/laws/ files.

Changes require:
- Manual review
- Project owner approval for L-CN, L-LC, L-SC changes
- Team consensus for L-CX, L-RV, L-OC changes

### Reference

For rule details, use read-only access:
```bash
cat docs/laws/README.md
cat docs/laws/01-customer-experience.md
# etc.
```
