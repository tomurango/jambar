"use client";

import { useRef, useState } from "react";
import BarcodeList from "@/components/BarcodeList";

type JanItem = {
  name: string;
  jan: string;
};

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [items, setItems] = useState<JanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImage(URL.createObjectURL(file));
    setItems([]);
    setError(null);
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        const MAX = 2048;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) {
            height = Math.round((height * MAX) / width);
            width = MAX;
          } else {
            width = Math.round((width * MAX) / height);
            height = MAX;
          }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.85);
      };
      img.src = url;
    });
  };

  const handleExtract = async () => {
    if (!imageFile) return;
    setLoading(true);
    setError(null);

    try {
      const compressed = await compressImage(imageFile);
      const formData = new FormData();
      formData.append("image", compressed, "image.jpg");

      const res = await fetch("/api/extract-jan", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "エラーが発生しました");
        return;
      }

      setItems(data.items || []);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">JANコード → バーコード変換</h1>
        <p className="text-gray-500 text-sm mb-6">
          表の画像をアップロードすると、JANコードを自動抽出してバーコードを生成します
        </p>

        {/* アップロードエリア */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition mb-4"
          onClick={() => fileInputRef.current?.click()}
        >
          {image ? (
            <img src={image} alt="アップロード画像" className="max-h-64 mx-auto rounded-lg shadow" />
          ) : (
            <div>
              <p className="text-gray-400 text-lg">クリックして画像を選択</p>
              <p className="text-gray-300 text-sm mt-1">JPG / PNG</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* 抽出ボタン */}
        {imageFile && (
          <button
            onClick={handleExtract}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition mb-6"
          >
            {loading ? "AIが解析中..." : "JANコードを抽出してバーコードを生成"}
          </button>
        )}

        {/* エラー */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {/* バーコード一覧 */}
        {items.length > 0 && <BarcodeList items={items} />}
      </div>
    </div>
  );
}
