import * as yaml from 'js-yaml';

const YAML_BLOCK_RE = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(\r?\n)/;

/**
 * Patch specific YAML frontmatter fields in a vault file.
 * Parses the YAML block, merges patches, re-serialises, returns full file.
 * Returns null on parse failure.
 */
export function patchFrontmatter(
  fileContent: string,
  patches: Record<string, unknown>
): string | null {
  const match = fileContent.match(YAML_BLOCK_RE);
  if (!match) return null;
  try {
    const parsed = yaml.load(match[1]);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const updated = { ...(parsed as Record<string, unknown>), ...patches };
    const newYaml = yaml.dump(updated, { lineWidth: -1, forceQuotes: false });
    const body = fileContent.slice(match[0].length);
    return `---\n${newYaml}---\n${match[2]}${body}`;
  } catch {
    return null;
  }
}

/**
 * Navigate a FileSystemDirectoryHandle down a relative path to a file handle.
 */
export async function navigateToFile(
  rootHandle: FileSystemDirectoryHandle,
  relativePath: string
): Promise<FileSystemFileHandle | null> {
  const parts = relativePath.replace(/^\/+/, '').split('/');
  let dir: FileSystemDirectoryHandle = rootHandle;
  for (let i = 0; i < parts.length - 1; i++) {
    try {
      dir = await dir.getDirectoryHandle(parts[i]);
    } catch {
      return null;
    }
  }
  try {
    return await dir.getFileHandle(parts[parts.length - 1]);
  } catch {
    return null;
  }
}
