import * as Clipboard from 'expo-clipboard';
import { useCallback, useState } from 'react';

export function useClipboard(resetAfterMs = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      await Clipboard.setStringAsync(text);
      setCopied(true);
      setTimeout(() => setCopied(false), resetAfterMs);
    },
    [resetAfterMs],
  );

  const paste = useCallback(() => Clipboard.getStringAsync(), []);

  return { copy, paste, copied };
}
