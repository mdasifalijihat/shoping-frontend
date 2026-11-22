"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useId, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

interface SortableEntry {
  id: string;
  title: string;
}

export function SortableList<T extends SortableEntry>({
  items,
  disabled,
  onReorder,
  renderItem,
}: {
  items: T[];
  disabled: boolean;
  onReorder: (items: T[]) => void;
  renderItem: (item: T, handle: ReactNode) => ReactNode;
}) {
  const id = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <DndContext
      id={id}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (disabled || !over || active.id === over.id) return;
        const from = items.findIndex((item) => item.id === active.id);
        const to = items.findIndex((item) => item.id === over.id);
        if (from >= 0 && to >= 0) onReorder(arrayMove(items, from, to));
      }}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {items.map((item) => (
            <SortableRow
              key={item.id}
              item={item}
              disabled={disabled}
              renderItem={renderItem}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow<T extends SortableEntry>({
  item,
  disabled,
  renderItem,
}: {
  item: T;
  disabled: boolean;
  renderItem: (item: T, handle: ReactNode) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: { draggable: disabled, droppable: disabled },
  });
  const handle = (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={`Reorder ${item.title}`}
      className="touch-none cursor-grab active:cursor-grabbing"
      disabled={disabled}
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
    >
      <GripVertical aria-hidden="true" />
    </Button>
  );

  return (
    <li
      ref={setNodeRef}
      className="relative"
      style={{
        transform: CSS.Translate.toString(transform),
        transition: transition,
        zIndex: isDragging ? 1 : undefined,
      }}
    >
      {renderItem(item, handle)}
    </li>
  );
}
