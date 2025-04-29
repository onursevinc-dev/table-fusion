/**
 * @author Onur Sevinc
 * @website https://onursevinc.dev
 */

"use client";

import { useState } from "react";
import { PDFViewer } from "@/components/pdf-viewer";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      alert("Lütfen geçerli bir PDF dosyası seçin.");
    }
  };

  return (
    <main className="min-h-screen pt-20 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-foreground">
            PDF Dosyası Seçin
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-muted-foreground
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-secondary file:text-secondary-foreground
              hover:file:bg-secondary/80"
          />
        </div>

        {file && <PDFViewer file={file} />}
      </div>
    </main>
  );
}
