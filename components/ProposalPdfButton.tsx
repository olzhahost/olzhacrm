"use client";

import type { CommercialProposalItem } from "@/types/database";

interface Props {
  number: string;
  title: string;
  date: string;
  clientName: string;
  items: CommercialProposalItem[];
  total: number;
}

export default function ProposalPdfButton({ number, title, date, clientName, items, total }: Props) {
  async function handleExport() {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("ОЛЖАПРОЕКТ", 14, 18);
    doc.setFontSize(11);
    doc.text(`Коммерческое предложение № ${number} от ${date}`, 14, 26);
    doc.text(`Заказчик: ${clientName}`, 14, 33);
    doc.text(title, 14, 40);

    autoTable(doc, {
      startY: 48,
      head: [["#", "Описание", "Ед.", "Кол-во", "Цена", "Сумма"]],
      body: items.map((it, idx) => [
        idx + 1,
        it.description,
        it.unit,
        it.quantity,
        it.unit_price.toLocaleString("ru-RU"),
        (it.quantity * it.unit_price).toLocaleString("ru-RU"),
      ]),
      foot: [["", "", "", "", "Итого:", `${total.toLocaleString("ru-RU")} тг`]],
    });

    doc.save(`KP-${number}.pdf`);
  }

  return (
    <button onClick={handleExport} className="btn-secondary">
      Скачать PDF
    </button>
  );
}
