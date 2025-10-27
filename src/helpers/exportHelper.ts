type Primitive = string | number | boolean | null;

export interface IExpandableRecord {
  [key: string]: Primitive | IExpandableRecord;
}

function parseValue(value: string): Primitive {
  if (value === null) return null;

  const lowerCaseValue = value.toLocaleLowerCase();
  if (lowerCaseValue === 'true') return true;
  if (lowerCaseValue === 'false') return false;

  const number = +value;
  if (!Number.isNaN(number) && value.trim() !== '') {
    return number;
  }

  return value;
}

export const expandObject = (source: Record<string, string>) => {
  const conflicts: Record<string, string> = {};

  const result = Object.entries(source)
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce<IExpandableRecord>((acc, [flatKey, value]) => {
      const parts = flatKey.split('.');
      let cursor = acc;

      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;

        if (isLast) {
          cursor[part] = parseValue(value);
        } else {
          if (typeof cursor[part] === 'string') {
            const accKey = parts.slice(0, index + 1).join('.');
            conflicts[accKey] = cursor[part];
          }

          if (!cursor[part] || typeof cursor[part] !== 'object') {
            cursor[part] = {};
          }

          cursor = cursor[part];
        }
      });

      return acc;
    }, {});

  if (Object.keys(conflicts).length > 0) {
    Object.assign(result, {
      __conflicts__: conflicts,
    });
  }

  return result;
};

export const downloadFile = (
  content: string,
  fileName: string,
  mimeType: string,
) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();

  URL.revokeObjectURL(url);
};
