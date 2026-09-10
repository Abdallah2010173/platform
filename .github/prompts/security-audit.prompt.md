---
name: Security Audit
description: Review selected code or a repository scope for security vulnerabilities, authorization flaws, data exposure, and missing protections.
argument-hint: Specify the audit scope or focus, such as file uploads, IDOR, authentication, or admin endpoints.
agent: agent
---

Perform a focused security audit of the provided code and the requested scope.

Context:
- Workspace: ${workspaceFolder}
- Selected code: ${selection}
- Requested scope: ${input:scope:What security area or code scope should be audited?}

Instructions:
- Inspect the selected code first, then follow nearby call sites, services, guards, repositories, schemas, and tests only as needed to verify behavior.
- Treat client-controlled identifiers, roles, file metadata, paths, tokens, and request bodies as untrusted.
- Check authorization and ownership boundaries, authentication and session handling, input validation, file handling, injection risks, sensitive-data exposure, rate limiting, error handling, configuration, and dependency or framework-specific risks when relevant.
- Distinguish confirmed vulnerabilities from plausible risks that require verification. Do not report speculative issues without explaining the missing evidence.
- Do not make code changes unless explicitly requested. Do not report style issues unless they create a security impact.

For each finding, provide:
1. Severity: critical, high, medium, low, or informational.
2. Title and affected file or symbol.
3. Evidence from the code and the attacker-controlled input or violated boundary.
4. Impact and a concise abuse scenario.
5. A specific remediation, including validation or authorization logic where appropriate.
6. A focused test or verification step.

Order findings by severity. Start with findings, then list assumptions and open questions, followed by positive security controls and remaining audit gaps. If no issue is confirmed, say so clearly and identify residual risk and untested areas. Use file links and line references when available.
