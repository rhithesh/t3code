# Findings

- The native `claude` CLI writes its own session history to `~/.claude/projects/<encoded-path>/*.jsonl` on disk.
- T3 Code never reads or scans that directory anywhere in its codebase. When you open a folder as a project, T3 only looks at _its own_ database (threads it created itself).
- The SDK package ships **precompiled per-platform binaries** (`@anthropic-ai/claude-agent-sdk-darwin-arm64`, `-linux-x64`, etc. — confirmed in `node_modules`), which is the real Claude Code engine.
- Calling `query(...)` spawns that binary as a **child process** and talks to it over **structured stdio** — a stream of typed `SDKMessage` objects (not human-readable terminal text), which is why T3 can get clean structured events instead of parsing ANSI output.
- T3 owns the **session identity**: it generates its own session UUID (`randomUUIDv4`, `ClaudeAdapter.ts:3788`) and passes it via `--resume <uuid>` (or lets the SDK start fresh) — it never reuses IDs from a session you started with the standalone `claude` CLI, which is exactly why that history doesn't cross over (per the findings file).
- Each `ProviderRuntimeEvent` the SDK emits (assistant deltas, tool calls, permission requests, result/usage messages) gets normalized and fed into the orchestration engine's command queue, which is what turns it into persisted events → projections → what you see in the UI.
- Config isolation: `apps/server/src/provider/Drivers/ClaudeHome.ts` sets a scoped `CLAUDE_CONFIG_DIR` per T3 provider instance so T3's managed Claude sessions don't collide with your regular `~/.claude` auth/config.
