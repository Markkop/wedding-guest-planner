Here you go—full instructions in one code block.

````md
# Pragmatic Drag and Drop (Atlassian) in React — Quick, Copy-Paste Guide

> ✅ Uses Atlassian’s **Pragmatic drag and drop** (`@atlaskit/pragmatic-drag-and-drop`) building blocks with React.
> Works in React 18 / StrictMode. Small core, headless, very fast.

---

## 0) Install

```bash
# pick one
npm i @atlaskit/pragmatic-drag-and-drop
yarn add @atlaskit/pragmatic-drag-and-drop
pnpm add @atlaskit/pragmatic-drag-and-drop
```
````

> Optional helpers (nice to have, not required):

```bash
# visual drop indicator (React + emotion under the hood)
npm i @atlaskit/pragmatic-drag-and-drop-react-indicator @emotion/react

# migration shim if you’re coming from react-beautiful-dnd (optional)
npm i @atlaskit/pragmatic-drag-and-drop-react-beautiful-dnd-migration
```

---

## 1) Minimal React setup (one draggable + one drop zone)

> The **element adapter** gives you `draggable`, `dropTargetForElements`, and `monitorForElements`.
> This is headless: you style things yourself.

```tsx
// app/DragBasic.tsx (Next.js) or src/DragBasic.tsx (Vite/Cra)
// If using Next.js App Router, put this at the top:
"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
  type ElementDragPayload,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

export default function DragBasic() {
  const dragRef = useRef<HTMLDivElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const [droppedMsg, setDroppedMsg] = useState<string>("Drop here");

  useEffect(() => {
    if (!dragRef.current || !dropRef.current) return;

    // 1) make the element draggable
    const cleanupDraggable = draggable({
      element: dragRef.current,
      getInitialData: () => ({ type: "CARD", id: "card-1", from: "inbox" }),
      onGenerateDragPreview({ nativeSetDragImage }) {
        // Optional: a crisp preview (defaults are fine)
        const el = dragRef.current!;
        nativeSetDragImage(el, 0, 0);
      },
    });

    // 2) make the drop zone accept element drags
    const cleanupDropTarget = dropTargetForElements({
      element: dropRef.current,
      canDrop({ source }) {
        return source.data.type === "CARD";
      },
      onDrop({ source }) {
        setDroppedMsg(`Got: ${source.data.id} from ${source.data.from}`);
      },
      onDragEnter() {
        dropRef.current!.style.outline = "2px solid dodgerblue";
      },
      onDragLeave() {
        dropRef.current!.style.outline = "none";
      },
      onDropTargetChange({ isActive }) {
        dropRef.current!.style.opacity = isActive ? "0.9" : "1";
      },
    });

    // 3) optional: know when *anything* is dragging (useful for global UI)
    const cleanupMonitor = monitorForElements({
      onDragStart() {
        document.body.classList.add("dragging");
      },
      onDragEnd() {
        document.body.classList.remove("dragging");
      },
    });

    return () => {
      cleanupDraggable();
      cleanupDropTarget();
      cleanupMonitor();
    };
  }, []);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div
        ref={dragRef}
        role="button"
        tabIndex={0}
        style={{
          width: 200,
          padding: 12,
          borderRadius: 8,
          border: "1px solid #ccc",
          cursor: "grab",
          userSelect: "none",
        }}
      >
        Drag me
      </div>

      <div
        ref={dropRef}
        style={{
          width: 260,
          height: 120,
          padding: 12,
          borderRadius: 8,
          border: "2px dashed #999",
          display: "grid",
          placeItems: "center",
          color: "#555",
        }}
      >
        {droppedMsg}
      </div>
    </div>
  );
}
```

---

## 2) Sortable **vertical list** (reorder items in place)

> Use the **array utility** `/reorder` to easily move an item within an array.

```tsx
// src/SortableList.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  draggable,
  dropTargetForElements,
  type ElementDragPayload,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";

type Item = { id: string; text: string };

export default function SortableList() {
  const [items, setItems] = useState<Item[]>(
    Array.from({ length: 6 }, (_, i) => ({ id: `i${i}`, text: `Item ${i}` }))
  );

  // A ref per row for drop targets
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const cleanups: Array<() => void> = [];

    // Register each row as draggable + drop target
    items.forEach((item, index) => {
      const el = rowRefs.current[item.id];
      if (!el) return;

      // Draggable
      cleanups.push(
        draggable({
          element: el,
          getInitialData: () => ({ type: "ROW", id: item.id, index }),
        })
      );

      // Drop target (to compute reorder)
      cleanups.push(
        dropTargetForElements({
          element: el,
          canDrop({ source }) {
            return source.data.type === "ROW" && source.data.id !== item.id;
          },
          getData({ input, element }) {
            // We’ll return info the drop algorithm can use
            return { dropId: item.id, index };
          },
          onDrop({ source, self }) {
            const from = source.data.index as number;
            const to = (self.data as any).index as number;
            setItems((prev) =>
              reorder({ list: prev, startIndex: from, finishIndex: to })
            );
          },
          onDragEnter({ self }) {
            const e = self.element as HTMLDivElement;
            e.style.background = "#f0f7ff";
          },
          onDragLeave({ self }) {
            const e = self.element as HTMLDivElement;
            e.style.background = "transparent";
          },
        })
      );
    });

    return () => cleanups.forEach((fn) => fn());
  }, [items]);

  return (
    <div style={{ display: "grid", gap: 8, width: 260 }}>
      {items.map((item) => (
        <div
          key={item.id}
          ref={(el) => (rowRefs.current[item.id] = el)}
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 12,
            background: "white",
            cursor: "grab",
          }}
        >
          {item.text}
        </div>
      ))}
    </div>
  );
}
```

---

## 3) **Kanban** / multi-list (move between columns)

```tsx
// src/Kanban.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";

type Card = { id: string; text: string };
type Column = { id: string; title: string; items: Card[] };

function moveBetween({
  source,
  destination,
  sourceIndex,
  destinationIndex,
}: {
  source: Column;
  destination: Column;
  sourceIndex: number;
  destinationIndex: number;
}) {
  const sourceClone = Array.from(source.items);
  const destClone = Array.from(destination.items);
  const [moved] = sourceClone.splice(sourceIndex, 1);
  destClone.splice(destinationIndex, 0, moved);
  return { [source.id]: sourceClone, [destination.id]: destClone };
}

export default function Kanban() {
  const [cols, setCols] = useState<Column[]>([
    { id: "todo", title: "Todo", items: [{ id: "t1", text: "Write docs" }] },
    {
      id: "doing",
      title: "Doing",
      items: [{ id: "d1", text: "Implement DnD" }],
    },
    { id: "done", title: "Done", items: [{ id: "f1", text: "Ship" }] },
  ]);

  // Refs for drop areas & cards
  const colRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const cleanups: Array<() => void> = [];

    // Register cards (draggable + row drop targets)
    cols.forEach((col) => {
      col.items.forEach((card, index) => {
        const el = cardRefs.current[card.id];
        if (!el) return;

        cleanups.push(
          draggable({
            element: el,
            getInitialData: () => ({
              type: "CARD",
              cardId: card.id,
              fromColId: col.id,
              fromIndex: index,
            }),
          })
        );

        cleanups.push(
          dropTargetForElements({
            element: el,
            canDrop({ source }) {
              return source.data.type === "CARD";
            },
            getData({ self }) {
              return {
                overCardId: card.id,
                overColId: col.id,
                overIndex: index,
              };
            },
            onDrop({ source, self }) {
              const fromColId = source.data.fromColId as string;
              const fromIndex = source.data.fromIndex as number;
              const toColId = (self.data as any).overColId as string;
              const toIndex = (self.data as any).overIndex as number;

              setCols((prev) => {
                const map = new Map(prev.map((c) => [c.id, { ...c }]));
                if (fromColId === toColId) {
                  const col = map.get(fromColId)!;
                  col.items = reorder({
                    list: col.items,
                    startIndex: fromIndex,
                    finishIndex: toIndex,
                  });
                } else {
                  const src = map.get(fromColId)!;
                  const dest = map.get(toColId)!;
                  const result = moveBetween({
                    source: src,
                    destination: dest,
                    sourceIndex: fromIndex,
                    destinationIndex: toIndex,
                  });
                  src.items = result[src.id];
                  dest.items = result[dest.id];
                }
                return Array.from(map.values());
              });
            },
          })
        );
      });
    });

    // Register column *containers* as drop targets too (empty-column drop)
    cols.forEach((col) => {
      const el = colRefs.current[col.id];
      if (!el) return;

      cleanups.push(
        dropTargetForElements({
          element: el,
          canDrop({ source }) {
            return source.data.type === "CARD";
          },
          getData() {
            return { overColId: col.id, overIndex: 0 };
          },
          onDrop({ source, self }) {
            const fromColId = source.data.fromColId as string;
            const fromIndex = source.data.fromIndex as number;
            const toColId = (self.data as any).overColId as string;

            setCols((prev) => {
              const map = new Map(prev.map((c) => [c.id, { ...c }]));
              if (fromColId !== toColId) {
                const src = map.get(fromColId)!;
                const dest = map.get(toColId)!;
                const result = moveBetween({
                  source: src,
                  destination: dest,
                  sourceIndex: fromIndex,
                  destinationIndex: 0,
                });
                src.items = result[src.id];
                dest.items = result[dest.id];
              }
              return Array.from(map.values());
            });
          },
        })
      );
    });

    return () => cleanups.forEach((fn) => fn());
  }, [cols]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 280px)",
        gap: 16,
      }}
    >
      {cols.map((col) => (
        <div
          key={col.id}
          ref={(el) => (colRefs.current[col.id] = el)}
          style={{
            background: "#f7f8fa",
            border: "1px solid #e5e6eb",
            borderRadius: 10,
            padding: 12,
            minHeight: 220,
          }}
        >
          <h3 style={{ marginTop: 0 }}>{col.title}</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {col.items.map((card) => (
              <div
                key={card.id}
                ref={(el) => (cardRefs.current[card.id] = el)}
                style={{
                  background: "white",
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  padding: 12,
                  cursor: "grab",
                }}
              >
                {card.text}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 4) Optional: React **drop indicator** for nicer visuals

```tsx
// src/WithDropIndicator.tsx
"use client";

import React, { useEffect, useRef } from "react";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import {
  DropIndicator,
  useDropIndicatorForElements,
} from "@atlaskit/pragmatic-drag-and-drop-react-indicator";

export default function WithDropIndicator() {
  const a = useRef<HTMLDivElement | null>(null);
  const b = useRef<HTMLDivElement | null>(null);

  // Attach indicator logic
  const indicatorA = useDropIndicatorForElements({ element: a });
  const indicatorB = useDropIndicatorForElements({ element: b });

  useEffect(() => {
    if (!a.current || !b.current) return;
    const cleanA = draggable({
      element: a.current,
      getInitialData: () => ({ type: "X" }),
    });
    const cleanB = dropTargetForElements({
      element: b.current,
      canDrop: () => true,
    });
    return () => {
      cleanA();
      cleanB();
    };
  }, []);

  return (
    <div style={{ display: "flex", gap: 16 }}>
      <div ref={a} style={{ width: 140, height: 80, border: "1px solid #ddd" }}>
        Drag source
      </div>
      <div
        ref={b}
        style={{
          width: 140,
          height: 80,
          border: "1px solid #ddd",
          position: "relative",
        }}
      >
        Target
        {/* Indicator renders into the target via a portal */}
        <DropIndicator {...indicatorB} />
      </div>
    </div>
  );
}
```

---

## 5) External file/text drops (upload zones)

```tsx
// src/ExternalDrops.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  dropTargetForExternal,
  monitorForExternal,
} from "@atlaskit/pragmatic-drag-and-drop/external/adapter";

export default function ExternalDrops() {
  const zone = useRef<HTMLDivElement | null>(null);
  const [files, setFiles] = useState<string[]>([]);

  useEffect(() => {
    if (!zone.current) return;

    const cleanDrop = dropTargetForExternal({
      element: zone.current,
      canDrop({ source }) {
        // accept files only
        return source.types.includes("Files");
      },
      async onDrop({ source }) {
        const fileList = await source.getData("Files");
        setFiles(Array.from(fileList as FileList).map((f) => f.name));
      },
      onDragEnter() {
        zone.current!.style.outline = "2px solid #5c6ac4";
      },
      onDragLeave() {
        zone.current!.style.outline = "none";
      },
    });

    const cleanMonitor = monitorForExternal({
      onDragStart() {
        document.body.dataset.externalDragging = "true";
      },
      onDragEnd() {
        delete document.body.dataset.externalDragging;
      },
    });

    return () => {
      cleanDrop();
      cleanMonitor();
    };
  }, []);

  return (
    <div>
      <div
        ref={zone}
        style={{
          width: 320,
          height: 150,
          border: "2px dashed #999",
          display: "grid",
          placeItems: "center",
        }}
      >
        Drop files here
      </div>
      <ul>
        {files.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 6) Keyboard & A11y (quick pointers)

```ts
/**
 * Pragmatic DnD is headless; you own the semantics.
 * Tips:
 * - Give draggables focusability (tabIndex=0) and a role (e.g. role="button" or role="listitem").
 * - Provide keyboard semantics yourself (e.g. Space to start "dragging mode", arrows to change target).
 * - Use visible focus styles; announce changes with aria-live if needed.
 * - Consider assistive packages or your design system’s controls for alternative input flows.
 */
```

---

## 7) Next.js / SSR notes

```ts
/**
 * - Place "use client" at the top of files that call the adapters.
 * - Create adapters in useEffect (client-only), not during SSR.
 * - Cleanup functions returned by draggable()/dropTargetFor…() to prevent leaks.
 * - Works in React 18 StrictMode.
 */
```

---

## 8) Performance checklist

```ts
/**
 * - Only register adapters on mounted elements.
 * - Avoid re-registering on every render: key your effects to stable arrays.
 * - Use the small helpers: `reorder` for lists; build your own for grid/board.
 * - Virtualization is supported (you control rendering strategy).
 * - Style via transforms (cheap) and avoid forced reflows in drag handlers.
 */
```

---

## 9) Coming from react-beautiful-dnd?

```ts
/**
 * - `react-beautiful-dnd` is archived by Atlassian.
 * - Either use the community fork `@hello-pangea/dnd` (drop-in) or migrate to Pragmatic DnD.
 * - Atlassian ships an optional migration shim:
 *   `@atlaskit/pragmatic-drag-and-drop-react-beautiful-dnd-migration`
 *   It lets you swap imports while you incrementally move to Pragmatic APIs.
 */
```

---

## 10) Useful imports (cheatsheet)

```ts
// Core element + external + text-selection adapters:
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

import {
  dropTargetForExternal,
  monitorForExternal,
} from "@atlaskit/pragmatic-drag-and-drop/external/adapter";

import {
  dropTargetForTextSelection,
  monitorForTextSelection,
} from "@atlaskit/pragmatic-drag-and-drop/text-selection/adapter";

// List helper:
import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";

// Optional React visual outputs:
import {
  DropIndicator,
  useDropIndicatorForElements,
} from "@atlaskit/pragmatic-drag-and-drop-react-indicator";
```

---

## 11) Gotchas / FAQs

```ts
/**
 * Q: Do I need a provider or global context?
 * A: No. It’s headless functions you attach to elements.

 * Q: Can I drag across portals/overlays?
 * A: Yes—register drop targets on the elements that should respond.

 * Q: Does it handle file drops?
 * A: Yes—use the external adapter (see #5).

 * Q: Can I use it with Tailwind/Emotion/Vanilla Extract/etc.?
 * A: Yes—rendering & styling are yours.

 * Q: How do I auto-scroll containers?
 * A: Use your own logic on drag events, or check the indicator examples package for patterns.

 * Q: React StrictMode?
 * A: Supported. Register in effects and clean up properly.

 * Q: Virtual lists?
 * A: Supported—because rendering is owned by you; just register adapters for visible items.
 */
```

---

```

```

**Sources:** Atlassian’s docs & packages and community references. ([Atlassian Design System][1], [npm][2], [CodeSandbox][3])

[1]: https://atlassian.design/components/pragmatic-drag-and-drop/core-package/?utm_source=chatgpt.com "Pragmatic drag and drop - index - Components"
[2]: https://www.npmjs.com/package/%40atlaskit/pragmatic-drag-and-drop?utm_source=chatgpt.com "atlaskit/pragmatic-drag-and-drop"
[3]: https://codesandbox.io/examples/package/%40atlaskit/pragmatic-drag-and-drop-react-indicator?utm_source=chatgpt.com "atlaskit/pragmatic-drag-and-drop-react-indicator examples"
[4]: https://github.com/hello-pangea/dnd?utm_source=chatgpt.com "hello-pangea/dnd: 💅 Beautiful and accessible drag ..."
[5]: https://dnd.hellopangea.com/?utm_source=chatgpt.com "Docs ⋅ Storybook - Pangea"
