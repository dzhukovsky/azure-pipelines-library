export type FolderNode<T> = {
  name: string;
  // Lowercased '/'-joined ancestor chain — the stable identity used to
  // remember collapsed folders across tree rebuilds.
  path: string;
  folders: FolderNode<T>[];
  items: T[];
};

export type GroupedItems<T> = {
  folders: FolderNode<T>[];
  ungrouped: T[];
};

// A grouping pattern is literal text plus two constructs:
//   *      matches any text (including empty) without creating a folder
//   {...}  matches one segment and creates one folder level
// Brace content is a comma-separated list of `condition:alias` entries,
// normalized so every shorthand shares one processing path:
//   {}                -> {*:}        folder named by the captured text
//   {Alias}           -> {*:Alias}   any text, fixed folder name
//   {secret:Secrets}  as written     segment must match the condition glob
// Conditions are globs themselves (`{*qwer*ww*:Secrets}`); an empty alias
// falls back to the captured text. The pattern must cover the whole name.
type PatternEntry = {
  condition: string;
  alias: string;
};

type CompiledPattern = {
  regex: RegExp;
  braces: PatternEntry[][];
};

const escapeRegExp = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Glob -> lazy regex fragment, so captures stop at the next literal.
const globToFragment = (glob: string): string =>
  glob.split('*').map(escapeRegExp).join('.*?');

const parseEntries = (content: string): PatternEntry[] =>
  content.split(',').map((entry) => {
    const separator = entry.indexOf(':');
    if (separator < 0) {
      return { condition: '*', alias: entry.trim() };
    }

    const condition = entry.slice(0, separator).trim();
    return { condition: condition || '*', alias: entry.slice(separator + 1).trim() };
  });

const parse = (pattern: string): CompiledPattern => {
  const braces: PatternEntry[][] = [];
  let body = '';
  let index = 0;

  while (index < pattern.length) {
    const open = pattern.indexOf('{', index);
    const close = pattern.indexOf('}', index);

    if (open < 0 && close < 0) {
      body += globToFragment(pattern.slice(index));
      break;
    }

    if (close >= 0 && (open < 0 || close < open)) {
      throw new Error("'}' has no matching '{'");
    }

    body += globToFragment(pattern.slice(index, open));

    const end = pattern.indexOf('}', open + 1);
    if (end < 0) {
      throw new Error("'{' has no matching '}'");
    }

    const content = pattern.slice(open + 1, end);
    if (content.includes('{')) {
      throw new Error('Nested braces are not supported');
    }

    const entries = parseEntries(content);
    braces.push(entries);
    body += `(${entries.map((e) => globToFragment(e.condition)).join('|')})`;
    index = end + 1;
  }

  if (!braces.length) {
    throw new Error('A pattern needs at least one {...} capture');
  }

  // Azure DevOps treats variable names case-insensitively.
  return { regex: new RegExp(`^${body}$`, 'i'), braces };
};

export const getPatternError = (pattern: string): string | undefined => {
  try {
    parse(pattern);
    return undefined;
  } catch (error) {
    return (error as Error).message;
  }
};

const entryMatches = (condition: string, value: string): boolean =>
  condition === '*' ||
  new RegExp(`^${globToFragment(condition)}$`, 'i').test(value);

const resolveName = (entries: PatternEntry[], captured: string): string => {
  const entry = entries.find((e) => entryMatches(e.condition, captured));
  return entry ? entry.alias || captured : captured;
};

type BuildNode<T> = {
  name: string;
  path: string;
  children: Map<string, BuildNode<T>>;
  items: T[];
};

export const groupByPatterns = <T>(
  items: readonly T[],
  getName: (item: T) => string,
  patterns: readonly string[] | undefined,
): GroupedItems<T> => {
  const compiled = (patterns ?? []).flatMap((pattern) => {
    try {
      return [parse(pattern)];
    } catch {
      // A malformed pattern stored by hand must not break the tree.
      return [];
    }
  });

  if (!compiled.length) {
    return { folders: [], ungrouped: [...items] };
  }

  const root = new Map<string, BuildNode<T>>();
  const ungrouped: T[] = [];

  for (const item of items) {
    const name = getName(item);

    // First pattern that yields at least one folder level claims the item.
    let segments: string[] = [];
    for (const { regex, braces } of compiled) {
      const match = regex.exec(name);
      if (!match) {
        continue;
      }

      segments = braces
        .map((entries, i) => resolveName(entries, match[i + 1] ?? ''))
        .filter((segment) => !!segment);

      if (segments.length) {
        break;
      }
    }

    if (!segments.length) {
      ungrouped.push(item);
      continue;
    }

    let level = root;
    let node: BuildNode<T> | undefined;
    let path = '';

    for (const segment of segments) {
      const key = segment.toLocaleLowerCase();
      path = path ? `${path}/${key}` : key;

      node = level.get(key);
      if (!node) {
        node = { name: segment, path, children: new Map(), items: [] };
        level.set(key, node);
      }

      level = node.children;
    }

    node?.items.push(item);
  }

  return { folders: finalize(root), ungrouped };
};

const finalize = <T>(level: Map<string, BuildNode<T>>): FolderNode<T>[] =>
  [...level.values()]
    .map<FolderNode<T>>((node) => ({
      name: node.name,
      path: node.path,
      folders: finalize(node.children),
      items: node.items,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
