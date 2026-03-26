"use client";

import { useEffect, useRef, useState } from "react";
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
  const [failed, setFailed] = useState(false);
  const [editValue, setEditValue] = useState(item.jan);
  const [currentJan, setCurrentJan] = useState(item.jan);

  useEffect(() => {
    if (!svgRef.current) return;
    try {
      JsBarcode(svgRef.current, currentJan, {
        format: currentJan.length === 8 ? "EAN8" : "EAN13",
        width: 3,
        height: 120,
        displayValue: true,
        fontSize: 18,
        margin: 16,
      });
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [currentJan]);

  const handleFix = () => {
    setCurrentJan(editValue);
  };

  return (
    <div className={`bg-white rounded-xl border p-6 flex flex-col items-center gap-3 w-full ${failed ? "border-red-300 bg-red-50" : "border-gray-200"}`}>
      {item.name && (
        <p className="text-base text-gray-600 font-medium text-center">{item.name}</p>
      )}

      {failed ? (
        <div className="w-full flex flex-col gap-2">
          <p className="text-sm text-red-600 text-center">
            読み取り結果: <span className="font-mono font-bold">{currentJan}</span>
            <br />
            <span className="text-xs text-red-400">桁数または数字が正しくない可能性があります</span>
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value.replace(/\D/g, ""))}
              maxLength={13}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-center font-mono text-lg tracking-widest"
            />
            <button
              onClick={handleFix}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
            >
              再生成
            </button>
          </div>
        </div>
      ) : (
        <svg ref={svgRef} className="w-full" />
      )}
    </div>
  );
}

type BarcodeListProps = {
  items: JanItem[];
};

export default function BarcodeList({ items }: BarcodeListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-700">
          生成されたバーコード（{items.length}件）
        </h2>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 transition print:hidden"
        >
          印刷
        </button>
      </div>
      <div className="flex flex-col gap-4">
        {items.map((item, i) => (
          <BarcodeItem key={i} item={item} />
        ))}
      </div>
    </div>
  );
}
