"use client";

import dynamic from "next/dynamic";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// PDF bileşenlerini dinamik olarak yükle ve client-side only olarak işaretle
const PDFViewerComponent = dynamic(() => import("./pdf-viewer-component"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
});

interface PDFViewerProps {
  file: File | string;
}

export function PDFViewer({ file }: PDFViewerProps) {
  return <PDFViewerComponent file={file} />;
}
