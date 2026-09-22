"use client";

import { useState } from "react";

interface Item {
  description: string;
  unit: string;
  quantity: number;
  unit_price: number;
}

export default function ProposalItemsEditor() {
  const [items, setItems] = useState<Item[]>([
    { description: "", unit: "усл.", quantity: 1, unit_price: 0 },
  ]);

  function updateItem(index: number, field: keyof Item, value: string | number) {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [field]: value } : it))
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { description: "", unit: "усл.", quantity: 1, unit_price: 0 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const total = items.reduce((sum, it) => sum + it.quantity * it.unit_price, 0);

  return (
    <div>
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 items-center">
            <input
              className="input col-span-5"
              placeholder="Раздел / вид работ (напр. Раздел АР)"
              value={item.description}
              onChange={(e) => updateItem(idx, "description", e.target.value)}
            />
            <input
              className="input col-span-2"
              placeholder="Ед."
              value={item.unit}
              onChange={(e) => updateItem(idx, "unit", e.target.value)}
            />
            <input
              className="input col-span-2"
              type="number"
              step="0.01"
              placeholder="Кол-во"
              value={item.quantity}
              onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
            />
            <input
              className="input col-span-2"
              type="number"
              step="0.01"
              placeholder="Цена"
              value={item.unit_price}
              onChange={(e) => updateItem(idx, "unit_price", Number(e.target.value))}
            />
            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="col-span-1 text-red-500 hover:text-red-700 text-sm"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={addItem} className="btn-secondary mt-3 text-xs">
        + Добавить строку
      </button>

      <p className="text-right text-sm font-semibold mt-3">
        Итого: {total.toLocaleString("ru-RU")} тг
      </p>
    </div>
  );
}
