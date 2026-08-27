audience: worker-deployers
level: patch
reference: issue 9007
---
Generic worker resolves a task as malformed-payload when the queue rejects createArtifact with a 4xx, instead of crashing the worker
