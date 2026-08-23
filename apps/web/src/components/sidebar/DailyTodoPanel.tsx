import { useState } from "react";
import { ListChecksIcon, PlusIcon, XIcon } from "lucide-react";

import { cn } from "~/lib/utils";
import { Checkbox } from "../ui/checkbox";
import {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogPanel,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { useDailyTodos, type DailyTodoItem, type DailyTodoSection } from "../../state/dailyTodos";

const SECTIONS: Array<{ key: DailyTodoSection; label: string }> = [
  { key: "work", label: "Work" },
  { key: "personal", label: "Personal" },
];

function TodoRow({
  item,
  onToggle,
  onRemove,
  onEdit,
}: {
  item: DailyTodoItem;
  onToggle: () => void;
  onRemove: () => void;
  onEdit: (text: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);

  const commit = () => {
    setIsEditing(false);
    onEdit(draft);
  };

  if (isEditing) {
    return (
      <li className="flex items-center gap-2 rounded-md px-1 py-1">
        <Checkbox checked={item.done} onCheckedChange={onToggle} />
        <Input
          nativeInput
          unstyled
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.currentTarget.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              commit();
            } else if (event.key === "Escape") {
              setDraft(item.text);
              setIsEditing(false);
            }
          }}
          className="min-w-0 flex-1 [&_[data-slot=input]]:h-auto [&_[data-slot=input]]:p-0 [&_[data-slot=input]]:text-sm [&_[data-slot=input]]:text-foreground"
        />
      </li>
    );
  }

  return (
    <li className="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/60">
      <Checkbox checked={item.done} onCheckedChange={onToggle} />
      <span
        onDoubleClick={() => {
          setDraft(item.text);
          setIsEditing(true);
        }}
        className={cn(
          "min-w-0 flex-1 truncate text-sm text-foreground",
          item.done && "text-muted-foreground/55 line-through",
        )}
      >
        {item.text}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${item.text}`}
        className="hidden size-5 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground/60 hover:bg-muted hover:text-foreground group-hover:flex"
      >
        <XIcon className="size-3.5" />
      </button>
    </li>
  );
}

function TodoSection({
  label,
  items,
  onAdd,
  onToggle,
  onRemove,
  onEdit,
}: {
  label: string;
  items: DailyTodoItem[];
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onEdit: (id: string, text: string) => void;
}) {
  const [draft, setDraft] = useState("");

  return (
    <div className="flex flex-col gap-1">
      <span className="px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
        {label}
      </span>
      {items.length > 0 ? (
        <ul className="flex flex-col">
          {items.map((item) => (
            <TodoRow
              key={item.id}
              item={item}
              onToggle={() => onToggle(item.id)}
              onRemove={() => onRemove(item.id)}
              onEdit={(text) => onEdit(item.id, text)}
            />
          ))}
        </ul>
      ) : null}
      <div className="flex items-center gap-1 px-1">
        <PlusIcon className="size-3.5 shrink-0 text-muted-foreground/60" />
        <Input
          nativeInput
          unstyled
          value={draft}
          onChange={(event) => setDraft(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onAdd(draft);
              setDraft("");
            }
          }}
          placeholder={`Add ${label.toLowerCase()} task`}
          aria-label={`Add ${label.toLowerCase()} task`}
          className="min-w-0 flex-1 [&_[data-slot=input]]:h-auto [&_[data-slot=input]]:p-0 [&_[data-slot=input]]:py-1 [&_[data-slot=input]]:text-sm [&_[data-slot=input]]:text-foreground"
        />
      </div>
    </div>
  );
}

export function DailyTodoPanel() {
  const { todos, addItem, toggleItem, removeItem, editItem } = useDailyTodos();

  const totalCount = todos.work.length + todos.personal.length;
  const doneCount = [...todos.work, ...todos.personal].filter((item) => item.done).length;

  return (
    <Dialog>
      <DialogTrigger className="mx-[var(--sidebar-content-inset)] flex h-8 items-center gap-2 rounded-md px-2 text-sm font-medium text-sidebar-muted-foreground hover:bg-sidebar-row-hover hover:text-sidebar-foreground">
        <ListChecksIcon className="size-4 shrink-0 text-sidebar-muted-foreground/80" />
        <span className="flex-1 text-left">Today</span>
        {totalCount > 0 ? (
          <span className="text-[11px] text-sidebar-muted-foreground/60">
            {doneCount}/{totalCount}
          </span>
        ) : null}
      </DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Today</DialogTitle>
        </DialogHeader>
        <DialogPanel>
          <div className="flex flex-col gap-4">
            {SECTIONS.map((section) => (
              <TodoSection
                key={section.key}
                label={section.label}
                items={todos[section.key]}
                onAdd={(text) => addItem(section.key, text)}
                onToggle={(id) => toggleItem(section.key, id)}
                onRemove={(id) => removeItem(section.key, id)}
                onEdit={(id, text) => editItem(section.key, id, text)}
              />
            ))}
          </div>
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}
