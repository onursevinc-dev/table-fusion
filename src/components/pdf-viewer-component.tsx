/**
 * @author Onur Sevinc
 * @website https://onursevinc.dev
 */

"use client";

import { Document, Page, pdfjs } from "react-pdf";
import { useState, useRef, useEffect } from "react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// PDF.js worker'ı için gerekli ayar
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

interface PDFViewerComponentProps {
  file: File | string;
}

interface Selection {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isResizing?: boolean;
  resizeHandle?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "top"
    | "right"
    | "bottom"
    | "left";
}

interface TextElement {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TableCell {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TableRow {
  cells: TableCell[];
}

interface Table {
  rows: TableRow[];
  pageNumber: number;
}

interface SelectedTable {
  table: Table;
  selection: Selection;
}

interface TableData {
  extraction_method: string;
  top: number;
  left: number;
  width: number;
  height: number;
  data: Array<
    Array<{
      top: number;
      left: number;
      width: number;
      height: number;
      text: string;
    }>
  >;
  spec_index: number;
}

export default function PDFViewerComponent({ file }: PDFViewerComponentProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [inputPage, setInputPage] = useState("");
  const [isSelecting, setIsSelecting] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [selectedTables, setSelectedTables] = useState<SelectedTable[]>([]);
  const pageRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastSelectionRef = useRef<Selection | null>(null);

  // Sayfa değiştiğinde seçim alanını temizle
  useEffect(() => {
    setSelection(null);
    setIsSelecting(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [pageNumber]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPage(e.target.value);
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPage = parseInt(inputPage);
    if (newPage && newPage > 0 && newPage <= (numPages || 1)) {
      setPageNumber(newPage);
    }
  };

  const goToPreviousPage = () => {
    const newPage = Math.max(pageNumber - 1, 1);
    setPageNumber(newPage);
    setInputPage(newPage.toString());
  };

  const goToNextPage = () => {
    const newPage = Math.min(pageNumber + 1, numPages || 1);
    setPageNumber(newPage);
    setInputPage(newPage.toString());
  };

  const extractTableFromSelection = () => {
    if (!selection || !pageRef.current) return;

    const textLayer = pageRef.current.querySelector(
      ".react-pdf__Page__textContent"
    );
    if (!textLayer) return;

    const textSpans = Array.from(textLayer.querySelectorAll("span"));
    const textElements: TextElement[] = [];

    // Sabit değerleri fonksiyonun başında tanımla
    const Y_TOLERANCE = 15; // Aynı satırda kabul edilecek maksimum y farkı
    const X_TOLERANCE = 5; // Hücreler arası maksimum boşluk

    textSpans.forEach((span) => {
      const rect = span.getBoundingClientRect();
      const pageRect = pageRef.current!.getBoundingClientRect();

      const x = rect.left - pageRect.left;
      const y = rect.top - pageRect.top;

      // Seçim alanı içinde mi kontrol et
      if (
        x >= Math.min(selection.startX, selection.endX) &&
        x + rect.width <= Math.max(selection.startX, selection.endX) &&
        y >= Math.min(selection.startY, selection.endY) &&
        y + rect.height <= Math.max(selection.startY, selection.endY)
      ) {
        textElements.push({
          text: span.textContent || "",
          x,
          y,
          width: rect.width,
          height: rect.height,
        });
      }
    });

    // Metin elementlerini yatay çizgilere göre grupla
    const lines: TextElement[][] = [];
    let currentLine: TextElement[] = [];
    let lastY = -1;

    textElements
      .sort((a, b) => a.y - b.y)
      .forEach((element) => {
        if (lastY === -1 || Math.abs(element.y - lastY) < Y_TOLERANCE) {
          currentLine.push(element);
        } else {
          if (currentLine.length > 0) {
            lines.push(currentLine);
          }
          currentLine = [element];
        }
        lastY = element.y;
      });

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    // Her satırdaki elementleri soldan sağa sırala ve grupla
    const rows: TableRow[] = lines.map((line) => {
      const sortedElements = line.sort((a, b) => a.x - b.x);
      const cells: TableCell[] = [];

      // Hücreleri grupla
      let currentGroup: TextElement[] = [];
      let lastX = -1;

      sortedElements.forEach((element) => {
        if (lastX === -1 || element.x - (lastX + X_TOLERANCE) < 0) {
          currentGroup.push(element);
        } else {
          // Mevcut grubu bir hücre olarak ekle
          if (currentGroup.length > 0) {
            const firstElement = currentGroup[0];
            const lastElement = currentGroup[currentGroup.length - 1];
            cells.push({
              text: currentGroup
                .map((e) => e.text)
                .join(" ")
                .trim(),
              x: firstElement.x,
              y: firstElement.y,
              width: lastElement.x + lastElement.width - firstElement.x,
              height: Math.max(...currentGroup.map((e) => e.height)),
            });
            currentGroup = [element];
          }
        }
        lastX = element.x + element.width;
      });

      // Son grubu ekle
      if (currentGroup.length > 0) {
        const firstElement = currentGroup[0];
        const lastElement = currentGroup[currentGroup.length - 1];
        cells.push({
          text: currentGroup
            .map((e) => e.text)
            .join(" ")
            .trim(),
          x: firstElement.x,
          y: firstElement.y,
          width: lastElement.x + lastElement.width - firstElement.x,
          height: Math.max(...currentGroup.map((e) => e.height)),
        });
      }

      return { cells };
    });

    // Tablo yapısını düzenle
    if (rows.length > 0) {
      // İlk satırı header olarak işaretle
      const headerRow = rows[0];

      // Diğer satırları düzenle
      const processedRows: TableRow[] = [headerRow];

      // Her satır için header sütunlarına göre hücreleri eşleştir
      for (let i = 1; i < rows.length; i++) {
        const currentRow = rows[i];
        const newCells: TableCell[] = [];

        // Header'daki her sütun için
        headerRow.cells.forEach((headerCell) => {
          // Aynı x pozisyonunda hücre var mı kontrol et
          const matchingCell = currentRow.cells.find(
            (cell) => Math.abs(cell.x - headerCell.x) < X_TOLERANCE
          );

          if (matchingCell) {
            newCells.push(matchingCell);
          } else {
            // Eşleşen hücre yoksa boş hücre ekle
            newCells.push({
              text: "",
              x: headerCell.x,
              y: currentRow.cells[0]?.y || 0,
              width: headerCell.width,
              height: currentRow.cells[0]?.height || 0,
            });
          }
        });

        processedRows.push({ cells: newCells });
      }

      const newTable = { rows: processedRows, pageNumber };
      setSelectedTables((prev) => [
        ...prev.filter((table) => table.table.pageNumber !== pageNumber),
        { table: newTable, selection },
      ]);
    }
  };

  const clearAllTables = () => {
    setSelectedTables([]);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!pageRef.current) return;

    const rect = pageRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Köşe ve kenar tutamaçlarını kontrol et
    if (selection) {
      const handleSize = 10;
      const minX = Math.min(selection.startX, selection.endX);
      const maxX = Math.max(selection.startX, selection.endX);
      const minY = Math.min(selection.startY, selection.endY);
      const maxY = Math.max(selection.startY, selection.endY);
      const width = maxX - minX;
      const height = maxY - minY;

      const handles = {
        "top-left": {
          x: minX - handleSize / 2,
          y: minY - handleSize / 2,
          width: handleSize,
          height: handleSize,
        },
        "top-right": {
          x: maxX - handleSize / 2,
          y: minY - handleSize / 2,
          width: handleSize,
          height: handleSize,
        },
        "bottom-left": {
          x: minX - handleSize / 2,
          y: maxY - handleSize / 2,
          width: handleSize,
          height: handleSize,
        },
        "bottom-right": {
          x: maxX - handleSize / 2,
          y: maxY - handleSize / 2,
          width: handleSize,
          height: handleSize,
        },
        top: {
          x: minX + width / 2 - handleSize / 2,
          y: minY - handleSize / 2,
          width: handleSize,
          height: handleSize,
        },
        right: {
          x: maxX - handleSize / 2,
          y: minY + height / 2 - handleSize / 2,
          width: handleSize,
          height: handleSize,
        },
        bottom: {
          x: minX + width / 2 - handleSize / 2,
          y: maxY - handleSize / 2,
          width: handleSize,
          height: handleSize,
        },
        left: {
          x: minX - handleSize / 2,
          y: minY + height / 2 - handleSize / 2,
          width: handleSize,
          height: handleSize,
        },
      };

      for (const [handle, area] of Object.entries(handles)) {
        if (
          mouseX >= area.x &&
          mouseX <= area.x + area.width &&
          mouseY >= area.y &&
          mouseY <= area.y + area.height
        ) {
          setIsSelecting(true);
          setSelection({
            ...selection,
            isResizing: true,
            resizeHandle: handle as Selection["resizeHandle"],
          });
          return;
        }
      }
    }

    // Yeni seçim başlat
    setIsSelecting(true);
    const newSelection = {
      startX: mouseX,
      startY: mouseY,
      endX: mouseX,
      endY: mouseY,
    };
    setSelection(newSelection);
    lastSelectionRef.current = newSelection;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !pageRef.current || !selection) return;

    const rect = pageRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // requestAnimationFrame ile optimize et
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      if (selection.isResizing && selection.resizeHandle) {
        const newSelection = { ...selection };

        switch (selection.resizeHandle) {
          case "top-left":
            newSelection.startX = mouseX;
            newSelection.startY = mouseY;
            break;
          case "top-right":
            newSelection.endX = mouseX;
            newSelection.startY = mouseY;
            break;
          case "bottom-left":
            newSelection.startX = mouseX;
            newSelection.endY = mouseY;
            break;
          case "bottom-right":
            newSelection.endX = mouseX;
            newSelection.endY = mouseY;
            break;
          case "top":
            newSelection.startY = mouseY;
            break;
          case "right":
            newSelection.endX = mouseX;
            break;
          case "bottom":
            newSelection.endY = mouseY;
            break;
          case "left":
            newSelection.startX = mouseX;
            break;
        }

        setSelection(newSelection);
        lastSelectionRef.current = newSelection;
      } else {
        const newSelection = { ...selection, endX: mouseX, endY: mouseY };
        setSelection(newSelection);
        lastSelectionRef.current = newSelection;
      }
    });
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    if (selection) {
      setSelection({
        ...selection,
        isResizing: false,
        resizeHandle: undefined,
      });
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      extractTableFromSelection();
    }
  };

  // Component unmount olduğunda animation frame'i temizle
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const exportToJSON = () => {
    const combinedTable = getCombinedTable();
    if (!combinedTable) return;

    // Create a default selection area if none exists
    const defaultSelection = {
      startY: 0,
      startX: 0,
      endX: 800, // Default width
      endY: 600, // Default height
    };

    const jsonData: TableData[] = [
      {
        extraction_method: "lattice",
        top: selection?.startY || defaultSelection.startY,
        left: selection?.startX || defaultSelection.startX,
        width: selection
          ? selection.endX - selection.startX
          : defaultSelection.endX,
        height: selection
          ? selection.endY - selection.startY
          : defaultSelection.endY,
        data: combinedTable.rows.map((row) =>
          row.cells.map((cell) => ({
            top: cell.y,
            left: cell.x,
            width: cell.width,
            height: cell.height,
            text: cell.text,
          }))
        ),
        spec_index: 0,
      },
    ];

    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "combined-table.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCombinedTable = () => {
    if (selectedTables.length === 0) return null;

    // Get all unique headers from all tables
    const allHeaders = new Set<string>();
    const commonHeaders = new Set<string>();
    let isFirstTable = true;

    // First, collect all headers and identify common ones
    selectedTables.forEach(({ table }) => {
      const headers = table.rows[0].cells.map((cell) => cell.text.trim());
      headers.forEach((header) => {
        allHeaders.add(header);
        if (isFirstTable) {
          commonHeaders.add(header);
        }
      });
      isFirstTable = false;
    });

    // Convert headers to arrays for easier manipulation
    const headerArray = Array.from(allHeaders);
    const commonHeaderArray = Array.from(commonHeaders);

    // Create the combined table structure
    const combinedRows: TableRow[] = [];

    // Add the header row with all columns
    const headerRow: TableRow = {
      cells: headerArray.map((header) => ({
        text: header,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      })),
    };
    combinedRows.push(headerRow);

    // Process each table's data rows
    selectedTables.forEach(({ table }) => {
      const tableHeaders = table.rows[0].cells.map((cell) => cell.text.trim());

      // Skip the header row and process data rows
      table.rows.slice(1).forEach((row) => {
        const newCells: TableCell[] = [];

        // For each column in the combined header
        headerArray.forEach((header) => {
          const headerIndex = tableHeaders.indexOf(header);
          if (headerIndex !== -1) {
            // If this column exists in the current table, use its value
            const cellValue = row.cells[headerIndex].text.trim();
            // Only add non-empty values
            if (cellValue) {
              newCells.push(row.cells[headerIndex]);
            } else {
              // If the cell is empty, try to find a matching cell in existing rows
              const matchingRow = combinedRows.find((existingRow) => {
                const pomCodeCell = existingRow.cells.find(
                  (cell) => cell.text.trim() === row.cells[0].text.trim()
                );
                return pomCodeCell !== undefined;
              });

              if (matchingRow) {
                const matchingCell = matchingRow.cells.find(
                  (cell) => cell.text.trim() === header
                );
                if (matchingCell) {
                  newCells.push(matchingCell);
                } else {
                  newCells.push({
                    text: "",
                    x: 0,
                    y: row.cells[0]?.y || 0,
                    width: 0,
                    height: row.cells[0]?.height || 0,
                  });
                }
              } else {
                newCells.push({
                  text: "",
                  x: 0,
                  y: row.cells[0]?.y || 0,
                  width: 0,
                  height: row.cells[0]?.height || 0,
                });
              }
            }
          } else {
            // If this column doesn't exist in the current table, add an empty cell
            newCells.push({
              text: "",
              x: 0,
              y: row.cells[0]?.y || 0,
              width: 0,
              height: row.cells[0]?.height || 0,
            });
          }
        });

        // Check if this row's POM Code already exists in combined rows
        const existingRowIndex = combinedRows.findIndex(
          (existingRow) =>
            existingRow.cells[0].text.trim() === row.cells[0].text.trim()
        );

        if (existingRowIndex !== -1) {
          // Merge the data with the existing row
          const existingRow = combinedRows[existingRowIndex];
          newCells.forEach((cell, index) => {
            if (cell.text.trim()) {
              existingRow.cells[index] = cell;
            }
          });
        } else {
          combinedRows.push({ cells: newCells });
        }
      });
    });

    // Sort the columns to maintain the order of common headers and append new ones
    const sortedHeaderArray = [...commonHeaderArray];
    headerArray.forEach((header) => {
      if (!commonHeaderArray.includes(header)) {
        sortedHeaderArray.push(header);
      }
    });

    // Reorder the rows based on the sorted headers
    const reorderedRows = combinedRows.map((row) => {
      const reorderedCells: TableCell[] = [];
      sortedHeaderArray.forEach((header) => {
        const index = headerArray.indexOf(header);
        reorderedCells.push(row.cells[index]);
      });
      return { cells: reorderedCells };
    });

    return { rows: reorderedRows };
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-2">
      <div className="flex justify-between items-center mb-2">
        <button
          onClick={goToPreviousPage}
          disabled={pageNumber <= 1}
          className="px-3 py-1 bg-secondary text-secondary-foreground rounded disabled:opacity-50"
        >
          Önceki
        </button>
        <div className="flex items-center gap-2">
          <form
            onSubmit={handlePageInputSubmit}
            className="flex items-center gap-2"
          >
            <input
              type="number"
              min="1"
              max={numPages || 1}
              value={inputPage}
              onChange={handlePageInputChange}
              className="w-24 px-3 py-1.5 border rounded text-sm"
              placeholder="Sayfa"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Git
            </button>
          </form>
          <span className="text-muted-foreground">/ {numPages || "--"}</span>
        </div>
        <button
          onClick={goToNextPage}
          disabled={pageNumber >= (numPages || 1)}
          className="px-3 py-1 bg-secondary text-secondary-foreground rounded disabled:opacity-50"
        >
          Sonraki
        </button>
      </div>
      <div
        className="pdf-container border rounded-lg overflow-hidden relative"
        ref={pageRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
        }}
      >
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          className="w-full"
          loading={
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            width={800}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="mx-auto"
          />
        </Document>
        {selection && (
          <div
            ref={selectionRef}
            className="selection-overlay"
            style={{
              position: "absolute",
              left: Math.min(selection.startX, selection.endX),
              top: Math.min(selection.startY, selection.endY),
              width: Math.abs(selection.endX - selection.startX),
              height: Math.abs(selection.endY - selection.startY),
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              border: "2px solid #3b82f6",
              pointerEvents: "none",
              willChange: "transform",
              transform: "translateZ(0)",
              userSelect: "none",
              WebkitUserSelect: "none",
              MozUserSelect: "none",
              msUserSelect: "none",
            }}
          >
            {/* Köşe tutamaçları */}
            <div
              className="resize-handle top-left"
              style={{
                position: "absolute",
                top: -5,
                left: -5,
                width: 10,
                height: 10,
                backgroundColor: "white",
                border: "2px solid #3b82f6",
                cursor: "nw-resize",
              }}
            />
            <div
              className="resize-handle top-right"
              style={{
                position: "absolute",
                top: -5,
                right: -5,
                width: 10,
                height: 10,
                backgroundColor: "white",
                border: "2px solid #3b82f6",
                cursor: "ne-resize",
              }}
            />
            <div
              className="resize-handle bottom-left"
              style={{
                position: "absolute",
                bottom: -5,
                left: -5,
                width: 10,
                height: 10,
                backgroundColor: "white",
                border: "2px solid #3b82f6",
                cursor: "sw-resize",
              }}
            />
            <div
              className="resize-handle bottom-right"
              style={{
                position: "absolute",
                bottom: -5,
                right: -5,
                width: 10,
                height: 10,
                backgroundColor: "white",
                border: "2px solid #3b82f6",
                cursor: "se-resize",
              }}
            />
            {/* Kenar tutamaçları */}
            <div
              className="resize-handle top"
              style={{
                position: "absolute",
                top: -5,
                left: "50%",
                transform: "translateX(-50%)",
                width: 10,
                height: 10,
                backgroundColor: "white",
                border: "2px solid #3b82f6",
                cursor: "ns-resize",
              }}
            />
            <div
              className="resize-handle right"
              style={{
                position: "absolute",
                right: -5,
                top: "50%",
                transform: "translateY(-50%)",
                width: 10,
                height: 10,
                backgroundColor: "white",
                border: "2px solid #3b82f6",
                cursor: "ew-resize",
              }}
            />
            <div
              className="resize-handle bottom"
              style={{
                position: "absolute",
                bottom: -5,
                left: "50%",
                transform: "translateX(-50%)",
                width: 10,
                height: 10,
                backgroundColor: "white",
                border: "2px solid #3b82f6",
                cursor: "ns-resize",
              }}
            />
            <div
              className="resize-handle left"
              style={{
                position: "absolute",
                left: -5,
                top: "50%",
                transform: "translateY(-50%)",
                width: 10,
                height: 10,
                backgroundColor: "white",
                border: "2px solid #3b82f6",
                cursor: "ew-resize",
              }}
            />
          </div>
        )}
      </div>

      {selectedTables.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-foreground">
              Birleştirilmiş Tablo
            </h3>
            <div className="flex gap-2">
              <button
                onClick={exportToJSON}
                className="px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                JSON Olarak İndir
              </button>
              <button
                onClick={clearAllTables}
                className="px-3 py-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
              >
                Tümünü Temizle
              </button>
            </div>
          </div>
          <div className="border rounded-lg overflow-auto">
            <table className="min-w-full divide-y divide-border">
              <tbody className="bg-background divide-y divide-border">
                {getCombinedTable()?.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.cells.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-2 py-1 whitespace-nowrap text-sm text-foreground border"
                      >
                        {cell.text}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
