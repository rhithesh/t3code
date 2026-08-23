import * as Schema from "effect/Schema";
import { useCallback, useMemo } from "react";

import { useLocalStorage } from "../hooks/useLocalStorage";

export type DailyTodoSection = "work" | "personal";

const TodoItemSchema = Schema.Struct({
  id: Schema.String,
  text: Schema.String,
  done: Schema.Boolean,
});
export type DailyTodoItem = typeof TodoItemSchema.Type;

const DailyTodosSchema = Schema.Struct({
  date: Schema.String,
  work: Schema.Array(TodoItemSchema),
  personal: Schema.Array(TodoItemSchema),
});
type DailyTodos = typeof DailyTodosSchema.Type;

const STORAGE_KEY = "t3code:daily-todos";

function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function emptyDay(date: string): DailyTodos {
  return { date, work: [], personal: [] };
}

function rollover(stored: DailyTodos, date: string): DailyTodos {
  if (stored.date === date) return stored;
  return {
    date,
    work: stored.work.filter((item) => !item.done),
    personal: stored.personal.filter((item) => !item.done),
  };
}

export function useDailyTodos() {
  const date = todayKey();
  const [stored, setStored] = useLocalStorage<DailyTodos, unknown>(
    STORAGE_KEY,
    emptyDay(date),
    DailyTodosSchema,
  );

  const todos = useMemo(() => rollover(stored, date), [stored, date]);

  const addItem = useCallback(
    (section: DailyTodoSection, text: string) => {
      const trimmed = text.trim();
      if (trimmed.length === 0) return;
      setStored((current) => {
        const base = rollover(current, date);
        const item: DailyTodoItem = { id: crypto.randomUUID(), text: trimmed, done: false };
        return { ...base, [section]: [...base[section], item] };
      });
    },
    [date, setStored],
  );

  const toggleItem = useCallback(
    (section: DailyTodoSection, id: string) => {
      setStored((current) => {
        const base = rollover(current, date);
        return {
          ...base,
          [section]: base[section].map((item) =>
            item.id === id ? { ...item, done: !item.done } : item,
          ),
        };
      });
    },
    [date, setStored],
  );

  const removeItem = useCallback(
    (section: DailyTodoSection, id: string) => {
      setStored((current) => {
        const base = rollover(current, date);
        return { ...base, [section]: base[section].filter((item) => item.id !== id) };
      });
    },
    [date, setStored],
  );

  const editItem = useCallback(
    (section: DailyTodoSection, id: string, text: string) => {
      const trimmed = text.trim();
      setStored((current) => {
        const base = rollover(current, date);
        if (trimmed.length === 0) {
          return { ...base, [section]: base[section].filter((item) => item.id !== id) };
        }
        return {
          ...base,
          [section]: base[section].map((item) =>
            item.id === id ? { ...item, text: trimmed } : item,
          ),
        };
      });
    },
    [date, setStored],
  );

  return { todos, addItem, toggleItem, removeItem, editItem };
}
