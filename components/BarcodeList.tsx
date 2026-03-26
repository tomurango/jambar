"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

type JanItem = {
  name: string;
  jan: string;
};

type BarcodeItemProps = {
  item: JanItem;
};

function BarcodeItem({ item }: BarcodeItemProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    try {
      JsBarcode(svgRef.current, item.jan, {
        format: item.jan.length === 8 ? "EAN8" : "EAN13",
        width: 2,
        height: 80,
        displayValue: true,
        fontSize: 14,
        margin: 10,
      });
    } catch {
      // 無効なJANコードの場合はスキップ
    }
  }, [item.jan]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center gap-2">
      {item.name && (
        <p className="text-sm text-gray-600 font-medium text-center">{item.name}</p>
      )}
      <svg ref={svgRef} />
      <p className="text-xs text-gray-400">{item.jan}</p>
    </div>
  );
}

type BarcodeListProps = {
  items: JanItem[];
};

export default function BarcodeList({ items }: BarcodeListProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-700">
          生成されたバーコード（{items.length}件）
        </h2>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 transition print:hidden"
        >
          印刷
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map((item, i) => (
          <BarcodeItem key={i} item={item} />
        ))}
      </div>
    </div>
  );
}
