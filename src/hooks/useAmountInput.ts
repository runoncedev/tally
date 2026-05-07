import { useRef } from "react";

export function useAmountInput(
  value: string,
  onChange: (raw: string) => void,
) {
  const ref = useRef<HTMLInputElement>(null);

  const displayValue =
    value === "" ? "" : Number(value).toLocaleString("en-US");

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = ref.current;
    if (!input) return;
    const cursor = input.selectionStart ?? 0;
    const selEnd = input.selectionEnd ?? 0;
    const val = input.value;

    if (cursor === selEnd) {
      if (e.key === "Backspace" && val[cursor - 1] === ",") {
        e.preventDefault();
        const raw = val.replace(/,/g, "");
        const rawCursor =
          cursor - (val.slice(0, cursor).match(/,/g) ?? []).length;
        const newRaw = raw.slice(0, rawCursor - 1) + raw.slice(rawCursor);
        if (newRaw === "" || /^\d+$/.test(newRaw)) {
          onChange(newRaw);
          requestAnimationFrame(() => {
            if (!ref.current) return;
            const formatted =
              newRaw === "" ? "" : Number(newRaw).toLocaleString("en-US");
            const targetRawCursor = rawCursor - 1;
            let digits = 0,
              pos = formatted.length;
            for (let i = 0; i < formatted.length; i++) {
              if (digits === targetRawCursor) { pos = i; break; }
              if (formatted[i] !== ",") digits++;
            }
            ref.current.setSelectionRange(pos, pos);
          });
        }
      } else if (e.key === "Delete" && val[cursor] === ",") {
        e.preventDefault();
        const raw = val.replace(/,/g, "");
        const rawCursor =
          cursor - (val.slice(0, cursor).match(/,/g) ?? []).length;
        const newRaw = raw.slice(0, rawCursor) + raw.slice(rawCursor + 1);
        if (newRaw === "" || /^\d+$/.test(newRaw)) {
          onChange(newRaw);
          requestAnimationFrame(() => {
            if (!ref.current) return;
            const formatted =
              newRaw === "" ? "" : Number(newRaw).toLocaleString("en-US");
            let digits = 0,
              pos = formatted.length;
            for (let i = 0; i < formatted.length; i++) {
              if (digits === rawCursor) { pos = i; break; }
              if (formatted[i] !== ",") digits++;
            }
            ref.current.setSelectionRange(pos, pos);
          });
        }
      }
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursorBefore = input.selectionStart ?? 0;
    const commasBefore = (
      input.value.slice(0, cursorBefore).match(/,/g) ?? []
    ).length;
    const rawCursor = cursorBefore - commasBefore;
    const raw = input.value.replace(/,/g, "");
    if (raw !== "" && !/^\d+$/.test(raw)) return;
    onChange(raw);
    requestAnimationFrame(() => {
      if (!ref.current) return;
      const formatted = raw === "" ? "" : Number(raw).toLocaleString("en-US");
      let digits = 0,
        pos = formatted.length;
      for (let i = 0; i < formatted.length; i++) {
        if (digits === rawCursor) { pos = i; break; }
        if (formatted[i] !== ",") digits++;
      }
      ref.current.setSelectionRange(pos, pos);
    });
  };

  return { ref, displayValue, onKeyDown, onChange: onInputChange };
}
