// App.tsx
import React, { useRef, useState, useEffect } from "react";
import rough from "roughjs";

interface Point {
  x: number;
  y: number;
}

interface TextElement {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  font: string;
  size: number;
}

interface ShapeElement {
  type: "rect" | "circle" | "line" | "arrow" | "star";
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  color: string;
  fill: boolean;
  roughness: number;
  points?: Point[];
}

type DrawingTool =
  | "pen"
  | "highlighter"
  | "marker"
  | "pencil"
  | "text"
  | "shape"
  | "eraser"
  | "select";
type ShapeType = "rect" | "circle" | "line" | "arrow" | "star";

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const roughCanvasRef = useRef<any>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<DrawingTool>("pen");
  const [size, setSize] = useState(5);
  const [color, setColor] = useState("#000000");
  const [canvasColor, setCanvasColor] = useState("#ffffff");
  const [lastPos, setLastPos] = useState<Point | null>(null);
  const [startPos, setStartPos] = useState<Point | null>(null);

  const [text, setText] = useState("");
  const [fontFamily, setFontFamily] = useState("Arial");
  const fontOptions = [
    "Arial",
    "Times New Roman",
    "Courier New",
    "Georgia",
    "Verdana",
    "Comic Sans MS",
    "Impact",
    "Tahoma",
  ];

  const [shapeType, setShapeType] = useState<ShapeType>("rect");
  const [fillShape, setFillShape] = useState(false);
  const [roughness, setRoughness] = useState(1);
  const [opacity, setOpacity] = useState(1);

  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [shapeElements, setShapeElements] = useState<ShapeElement[]>([]);

  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [draggingOffset, setDraggingOffset] = useState<Point | null>(null);
  const [isResizingText, setIsResizingText] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState("");

  const [strokeHistory, setStrokeHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showCanvasColorPicker, setShowCanvasColorPicker] = useState(false);
  const [eraserWarning, setEraserWarning] = useState(false);
  const [colorSliderH, setColorSliderH] = useState(0);
  const [colorSliderSV, setColorSliderSV] = useState({ s: 100, v: 100 });

  const colorPresets = [
    { label: "Black", value: "#000000" },
    { label: "Gray", value: "#808080" },
    { label: "White", value: "#ffffff" },
    { label: "Red", value: "#ff0000" },
    { label: "Green", value: "#00ff00" },
    { label: "Blue", value: "#0000ff" },
    { label: "Yellow", value: "#ffff00" },
    { label: "Magenta", value: "#ff00ff" },
  ];

  // Check if eraser is selected and canvas color is same as drawing color
  useEffect(() => {
    if (tool === "eraser") {
      setEraserWarning(color === canvasColor);
    }
  }, [tool, color, canvasColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    roughCanvasRef.current = rough.canvas(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = canvasColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    saveToHistory();
  }, [canvasColor]);

  // Update canvas size on window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      canvas.width = window.innerWidth;

      const toolbarHeight = window.innerWidth < 768 ? 120 : 100;
      canvas.height = window.innerHeight - toolbarHeight;

      ctx.fillStyle = canvasColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.putImageData(imageData, 0, 0);

      redrawElements();
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [canvasColor, textElements, shapeElements]);

  const hsvToRgb = (h: number, s: number, v: number): string => {
    let r, g, b;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
      case 0:
        r = v;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = v;
        b = p;
        break;
      case 2:
        r = p;
        g = v;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = v;
        break;
      case 4:
        r = t;
        g = p;
        b = v;
        break;
      case 5:
        r = v;
        g = p;
        b = q;
        break;
      default:
        r = 0;
        g = 0;
        b = 0;
    }

    r = Math.round(r * 255);
    g = Math.round(g * 255);
    b = Math.round(b * 255);

    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  };

  const addToRecentColors = (newColor: string) => {
    if (!recentColors.includes(newColor)) {
      setRecentColors([newColor, ...recentColors.slice(0, 7)]);
    }
  };

  const generateId = (): string => {
    return Math.random().toString(36).substring(2, 15);
  };

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const newHistory = strokeHistory.slice(0, historyIndex + 1);

    setStrokeHistory([...newHistory, imageData]);
    setHistoryIndex(newHistory.length);
  };

  const undo = () => {
    if (historyIndex <= 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const newIndex = historyIndex - 1;
    ctx.putImageData(strokeHistory[newIndex], 0, 0);
    setHistoryIndex(newIndex);
  };

  const redo = () => {
    if (historyIndex >= strokeHistory.length - 1) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const newIndex = historyIndex + 1;
    ctx.putImageData(strokeHistory[newIndex], 0, 0);
    setHistoryIndex(newIndex);
  };

  const drawShape = (ctx: CanvasRenderingContext2D, shape: ShapeElement) => {
    const rc = roughCanvasRef.current;
    if (!rc) return;

    switch (shape.type) {
      case "rect":
        rc.rectangle(shape.x, shape.y, shape.width || 0, shape.height || 0, {
          ...(shape.fill
            ? { fill: shape.color, fillStyle: "solid" }
            : { stroke: shape.color }),
          roughness: shape.roughness,
        });
        break;
      case "circle":
        rc.circle(shape.x, shape.y, shape.radius || 0, {
          ...(shape.fill
            ? { fill: shape.color, fillStyle: "solid" }
            : { stroke: shape.color }),
          roughness: shape.roughness,
        });
        break;
      case "line":
        rc.line(
          shape.x,
          shape.y,
          (shape.width || 0) + shape.x,
          (shape.height || 0) + shape.y,
          {
            stroke: shape.color,
            roughness: shape.roughness,
          }
        );
        break;
      case "arrow":
        rc.line(
          shape.x,
          shape.y,
          (shape.width || 0) + shape.x,
          (shape.height || 0) + shape.y,
          {
            stroke: shape.color,
            roughness: shape.roughness,
          }
        );

        const angle = Math.atan2(shape.height || 0, shape.width || 0);
        const arrowSize = Math.min(
          20,
          Math.sqrt(
            Math.pow(shape.width || 0, 2) + Math.pow(shape.height || 0, 2)
          ) / 3
        );

        ctx.fillStyle = shape.color;
        ctx.beginPath();
        ctx.moveTo((shape.width || 0) + shape.x, (shape.height || 0) + shape.y);
        ctx.lineTo(
          (shape.width || 0) +
            shape.x -
            arrowSize * Math.cos(angle - Math.PI / 6),
          (shape.height || 0) +
            shape.y -
            arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          (shape.width || 0) +
            shape.x -
            arrowSize * Math.cos(angle + Math.PI / 6),
          (shape.height || 0) +
            shape.y -
            arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
        break;
      case "star":
        const radius = shape.radius || 50;
        const spikes = 5;
        const outerRadius = radius;
        const innerRadius = radius / 2;
        const cx = shape.x;
        const cy = shape.y;

        let points = [];
        for (let i = 0; i < spikes * 2; i++) {
          const r = i % 2 === 0 ? outerRadius : innerRadius;
          const starAngle = (Math.PI / spikes) * i;
          points.push([
            cx + Math.cos(starAngle) * r,
            cy + Math.sin(starAngle) * r,
          ]);
        }

        rc.polygon(points, {
          ...(shape.fill
            ? { fill: shape.color, fillStyle: "solid" }
            : { stroke: shape.color }),
          roughness: shape.roughness,
        });
        break;
    }
  };

  const clearTextRect = (textEl: TextElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.font = `${textEl.size}px ${textEl.font}`;
    const metrics = ctx.measureText(textEl.text);
    const height = textEl.size;

    ctx.fillStyle = canvasColor;
    ctx.fillRect(
      textEl.x - 10,
      textEl.y - height - 10,
      metrics.width + 20,
      height + 20
    );
  };

  const drawTextSelection = (
    ctx: CanvasRenderingContext2D,
    textEl: TextElement
  ) => {
    ctx.font = `${textEl.size}px ${textEl.font}`;
    const metrics = ctx.measureText(textEl.text);
    const height = textEl.size;

    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    ctx.strokeRect(
      textEl.x - 4,
      textEl.y - height,
      metrics.width + 8,
      height + 8
    );

    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(textEl.x + metrics.width + 4 - 6, textEl.y + 4 - 6, 12, 12);

    ctx.setLineDash([]);
  };

  const clearSelectionIndicators = (
    ctx: CanvasRenderingContext2D,
    textEl: TextElement
  ) => {
    ctx.font = `${textEl.size}px ${textEl.font}`;
    const metrics = ctx.measureText(textEl.text);
    const height = textEl.size;

    ctx.fillStyle = canvasColor;
    ctx.fillRect(
      textEl.x - 6,
      textEl.y - height - 6,
      metrics.width + 16,
      height + 16
    );

    ctx.font = `${textEl.size}px ${textEl.font}`;
    ctx.fillStyle = textEl.color;
    ctx.fillText(textEl.text, textEl.x, textEl.y);
  };

  const updateTextElement = (
    textId: string,
    updater: (el: TextElement) => Partial<TextElement>,
    redrawSelectionBox: boolean = true
  ) => {
    if (!textId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const textElement = textElements.find((el) => el.id === textId);
    if (!textElement) return;

    clearTextRect(textElement);

    const updatedElements = textElements.map((el) =>
      el.id === textId ? { ...el, ...updater(el) } : el
    );

    setTextElements(updatedElements);

    const updatedElement = updatedElements.find((el) => el.id === textId);
    if (!updatedElement) return;

    ctx.font = `${updatedElement.size}px ${updatedElement.font}`;
    ctx.fillStyle = updatedElement.color;
    ctx.fillText(updatedElement.text, updatedElement.x, updatedElement.y);

    if (redrawSelectionBox && selectedTextId === textId) {
      drawTextSelection(ctx, updatedElement);
    }

    saveToHistory();
  };

  const redrawElements = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!roughCanvasRef.current) {
      roughCanvasRef.current = rough.canvas(canvas);
    }

    shapeElements.forEach((el) => {
      drawShape(ctx, el);
    });

    textElements.forEach((el) => {
      ctx.font = `${el.size}px ${el.font}`;
      ctx.fillStyle = el.color;
      ctx.fillText(el.text, el.x, el.y);

      if (selectedTextId === el.id) {
        drawTextSelection(ctx, el);
      }
    });
  };

  // Function to check if a point is inside text element
  const isPointInText = (
    x: number,
    y: number,
    textElement: TextElement
  ): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const ctx = canvas.getContext("2d");
    if (!ctx) return false;

    ctx.font = `${textElement.size}px ${textElement.font}`;
    const metrics = ctx.measureText(textElement.text);
    const height = textElement.size;

    const padding = 10;
    return (
      x >= textElement.x - padding &&
      x <= textElement.x + metrics.width + padding &&
      y >= textElement.y - height - padding &&
      y <= textElement.y + padding
    );
  };

  // Function to check if a point is in resize handle
  const isPointInResizeHandle = (
    x: number,
    y: number,
    textElement: TextElement
  ): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const ctx = canvas.getContext("2d");
    if (!ctx) return false;

    ctx.font = `${textElement.size}px ${textElement.font}`;
    const metrics = ctx.measureText(textElement.text);

    const handleX = textElement.x + metrics.width + 4 - 6;
    const handleY = textElement.y + 4 - 6;
    const handleSize = 12;

    return (
      x >= handleX &&
      x <= handleX + handleSize &&
      y >= handleY &&
      y <= handleY + handleSize
    );
  };

  const handleSelectionChange = (newId: string | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (selectedTextId) {
      const prevSelected = textElements.find((el) => el.id === selectedTextId);
      if (prevSelected) {
        clearSelectionIndicators(ctx, prevSelected);
      }
    }

    setSelectedTextId(newId);

    if (newId) {
      const newSelected = textElements.find((el) => el.id === newId);
      if (newSelected) {
        drawTextSelection(ctx, newSelected);
      }
    }
  };

  // Drawing event handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setStartPos({ x, y });
    setLastPos({ x, y });

    if (editingTextId) {
      updateTextElement(editingTextId, (el) => ({ text: editingTextValue }));
      setEditingTextId(null);
    }

    if (tool === "select") {
      let textFound = false;

      if (selectedTextId) {
        const selectedText = textElements.find(
          (el) => el.id === selectedTextId
        );
        if (selectedText && isPointInResizeHandle(x, y, selectedText)) {
          setIsResizingText(true);
          textFound = true;
          return;
        }
      }

      if (!textFound) {
        for (let i = textElements.length - 1; i >= 0; i--) {
          const el = textElements[i];
          if (isPointInText(x, y, el)) {
            if (selectedTextId !== el.id) {
              handleSelectionChange(el.id);
            }

            setIsDraggingText(true);
            setDraggingOffset({ x: x - el.x, y: y - el.y });
            textFound = true;
            return;
          }
        }
      }

      if (!textFound && selectedTextId) {
        handleSelectionChange(null);
      }

      return;
    }

    if (tool !== "select" && selectedTextId) {
      handleSelectionChange(null);
    }

    setIsDrawing(true);

    if (tool === "text") {
      if (!text) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const fontSize = size * 5;
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);

      const newTextElement: TextElement = {
        id: generateId(),
        x,
        y,
        text,
        color,
        font: fontFamily,
        size: fontSize,
      };

      const newTextElements = [...textElements, newTextElement];
      setTextElements(newTextElements);
      setText("");
      setIsDrawing(false);
      saveToHistory();

      setTool("select");
      handleSelectionChange(newTextElement.id);
    } else if (tool === "eraser") {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = canvasColor;
      ctx.beginPath();
      ctx.arc(x, y, size * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle text manipulation
    if (tool === "select") {
      if (isDraggingText && selectedTextId && draggingOffset) {
        const newX = x - draggingOffset.x;
        const newY = y - draggingOffset.y;

        updateTextElement(selectedTextId, () => ({ x: newX, y: newY }), false);

        ctx.fillStyle = canvasColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        redrawElements();

        return;
      }

      if (isResizingText && selectedTextId) {
        const selectedText = textElements.find(
          (el) => el.id === selectedTextId
        );
        if (!selectedText) return;

        const originalTextX = selectedText.x;
        const originalTextSize = selectedText.size;
        const originalTextWidth = ctx.measureText(selectedText.text).width;

        const dragDistance = x - (originalTextX + originalTextWidth);
        const scaleFactor = 1 + dragDistance / originalTextWidth;
        const newSize = Math.max(
          10,
          Math.min(200, originalTextSize * scaleFactor)
        );

        updateTextElement(selectedTextId, () => ({ size: newSize }), false);

        ctx.fillStyle = canvasColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        redrawElements();

        return;
      }

      return;
    }

    if (!isDrawing || !lastPos) return;

    if (tool === "shape") {
      if (!startPos) return;

      if (historyIndex >= 0) {
        ctx.putImageData(strokeHistory[historyIndex], 0, 0);
      }

      const width = x - startPos.x;
      const height = y - startPos.y;
      const radius = Math.sqrt(
        Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2)
      );

      const previewShape: ShapeElement = {
        type: shapeType,
        x: startPos.x,
        y: startPos.y,
        width,
        height,
        radius:
          shapeType === "circle" || shapeType === "star" ? radius : undefined,
        color,
        fill: fillShape,
        roughness,
      };

      drawShape(ctx, previewShape);
    } else if (tool === "eraser") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = canvasColor;
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(x, y);
      ctx.lineWidth = size * 4;
      ctx.lineCap = "round";
      ctx.stroke();
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(x, y);

      // Set style based on tool
      switch (tool) {
        case "highlighter":
          ctx.globalAlpha = 0.3;
          ctx.lineWidth = size * 3;
          break;
        case "marker":
          ctx.globalAlpha = 1;
          ctx.lineWidth = size * 2;
          break;
        case "pencil":
          ctx.globalAlpha = 0.8;
          ctx.lineWidth = size / 2;
          break;
        case "pen":
        default:
          ctx.globalAlpha = opacity;
          ctx.lineWidth = size;
          break;
      }

      ctx.strokeStyle = color;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    setLastPos({ x, y });
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (tool === "select") {
      if (isDraggingText || isResizingText) {
        saveToHistory();
      }

      setIsDraggingText(false);
      setDraggingOffset(null);
      setIsResizingText(false);

      return;
    }

    if (!isDrawing) return;

    if (tool === "shape" && startPos) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const width = x - startPos.x;
      const height = y - startPos.y;
      const radius = Math.sqrt(
        Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2)
      );

      // Create new shape
      const newShape: ShapeElement = {
        type: shapeType,
        x: startPos.x,
        y: startPos.y,
        width,
        height,
        radius:
          shapeType === "circle" || shapeType === "star" ? radius : undefined,
        color,
        fill: fillShape,
        roughness,
      };

      setShapeElements([...shapeElements, newShape]);
    }

    setIsDrawing(false);
    setLastPos(null);
    saveToHistory();
  };

  const clearCanvas = () => {
    if (window.confirm("Are you sure you want to clear the canvas?")) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = canvasColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      setTextElements([]);
      setShapeElements([]);
      setSelectedTextId(null);
      saveToHistory();
    }
  };

  const exportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "drawing.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOutsideClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showColorPicker) setShowColorPicker(false);
    if (showCanvasColorPicker) setShowCanvasColorPicker(false);
  };

  // Icon components
  const Icon = ({ type }: { type: string }) => {
    switch (type) {
      case "undo":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "redo":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.293 3.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 9H9a5 5 0 00-5 5v2a1 1 0 11-2 0v-2a7 7 0 017-7h5.586l-2.293-2.293a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "clear":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "export":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "menu":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        );
      case "select":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      // Tool icons
      case "pen":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 20l4-4L5 9l10-5 4 4-5 10-9 2z" />
            <path d="M7 13l4 4" />
          </svg>
        );
      case "highlighter":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.172 2.172a4 4 0 015.656 0L16 8.344V14a2 2 0 01-2 2H6a2 2 0 01-2-2V8.344l6.172-6.172zm9.828 7.758l-5-5L6.828 7.101 5 8.93V14h10V9.93l-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "marker":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.7 3.3l6 6L7 23H1v-6L14.7 3.3z" />
            <path d="M2 22l5-1-4-4-1 5z" />
          </svg>
        );
      case "pencil":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        );
      case "text":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "shape":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
          </svg>
        );
      case "eraser":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414L11.414 12l3.293 3.293a1 1 0 01-1.414 1.414L10 13.414l-3.293 3.293a1 1 0 01-1.414-1.414L8.586 12 5.293 8.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        );
      // Shape icons
      case "rect":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H4zm0 2h12v10H4V5z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "circle":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "line":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          >
            <line x1="4" y1="10" x2="16" y2="10" />
          </svg>
        );
      case "arrow":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "star":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Tooltip component
  const Tooltip = ({
    children,
    text,
    position = "bottom",
  }: {
    children: React.ReactNode;
    text: string;
    position?: "top" | "bottom";
  }) => (
    <div className="group relative inline-block">
      {children}
      <div
        className={`absolute left-1/2 -translate-x-1/2 ${
          position === "bottom" ? "bottom-full mb-2" : "top-full mt-2"
        } hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-50`}
      >
        {text}
        <div
          className={`absolute ${
            position === "bottom" ? "top-full" : "bottom-full"
          } left-1/2 -translate-x-1/2 h-0 w-0 border-x-4 border-x-transparent ${
            position === "bottom"
              ? "border-t-4 border-t-gray-800"
              : "border-b-4 border-b-gray-800"
          }`}
        ></div>
      </div>
    </div>
  );

  // Advanced Color Picker Component
  const ColorPickerComponent = ({
    currentColor,
    onColorChange,
    onClose,
  }: {
    currentColor: string;
    onColorChange: (color: string) => void;
    onClose: () => void;
  }) => {
    const [localHue, setLocalHue] = useState(0);
    const [localSV, setLocalSV] = useState({ s: 100, v: 100 });
    const [tempColor, setTempColor] = useState(currentColor);

    // Handle hue slider change
    const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const h = parseFloat(e.target.value) / 360;
      setLocalHue(h);
      const newColor = hsvToRgb(h, localSV.s / 100, localSV.v / 100);
      setTempColor(newColor);
    };

    // Handle clicks on the SV picker area
    const handleSVChange = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const s = Math.max(
        0,
        Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)
      );
      const v = Math.max(
        0,
        Math.min(100, 100 - ((e.clientY - rect.top) / rect.height) * 100)
      );

      setLocalSV({ s, v });
      const newColor = hsvToRgb(localHue, s / 100, v / 100);
      setTempColor(newColor);
    };

    const applyColor = () => {
      onColorChange(tempColor);
      addToRecentColors(tempColor);
      onClose();
    };

    return (
      <div className="p-4 bg-white rounded-lg shadow-xl max-w-xs w-full">
        {/* Color preview */}
        <div
          className="h-12 w-full rounded-md mb-3 border border-gray-300"
          style={{ backgroundColor: tempColor }}
        />

        {/* Hue slider */}
        <div className="mb-4">
          <div
            className="h-6 w-full rounded-md mb-1 relative"
            style={{
              background:
                "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
            }}
          >
            <input
              type="range"
              min="0"
              max="360"
              value={localHue * 360}
              onChange={handleHueChange}
              className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div
              className="absolute top-0 h-full w-1 bg-white border border-gray-400 rounded-sm pointer-events-none"
              style={{ left: `${localHue * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">Hue</span>
        </div>

        {/* Saturation/Value picker */}
        <div
          className="h-40 w-full rounded-md mb-3 relative cursor-crosshair"
          style={{
            backgroundColor: hsvToRgb(localHue, 1, 1),
            background: `
              linear-gradient(to right, #fff, ${hsvToRgb(localHue, 1, 1)}),
              linear-gradient(to top, #000, transparent)
            `,
            backgroundBlendMode: "multiply",
          }}
          onClick={handleSVChange}
        >
          <div
            className="absolute h-4 w-4 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `${localSV.s}%`,
              top: `${100 - localSV.v}%`,
              boxShadow: "0 0 0 1px rgba(0,0,0,0.3)",
            }}
          />
        </div>

        {/* Recent colors */}
        {recentColors.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-500 mb-1">Recent:</div>
            <div className="flex flex-wrap gap-1">
              {recentColors.map((clr, idx) => (
                <button
                  key={idx}
                  className="h-6 w-6 rounded-md border border-gray-300"
                  style={{ backgroundColor: clr }}
                  onClick={() => setTempColor(clr)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Presets */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-1">Presets:</div>
          <div className="flex flex-wrap gap-1">
            {colorPresets.map((preset) => (
              <button
                key={preset.value}
                className="h-6 w-6 rounded-md border border-gray-300"
                style={{ backgroundColor: preset.value }}
                title={preset.label}
                onClick={() => setTempColor(preset.value)}
              />
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-200 rounded-md text-sm hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={applyColor}
            className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
          >
            Apply
          </button>
        </div>
      </div>
    );
  };

  // Button components
  const ActionButton = ({
    onClick,
    disabled = false,
    title,
    icon,
  }: {
    onClick: () => void;
    disabled?: boolean;
    title: string;
    icon: string;
  }) => (
    <Tooltip text={title} position="top">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`p-2 rounded-full ${
          disabled ? "opacity-50" : "hover:bg-blue-500"
        } transition-all`}
        title={title}
      >
        <Icon type={icon} />
      </button>
    </Tooltip>
  );

  const ToolButton = ({
    name,
    selected,
    onClick,
  }: {
    name: string;
    selected: boolean;
    onClick: () => void;
  }) => (
    <Tooltip text={name.charAt(0).toUpperCase() + name.slice(1)}>
      <button
        onClick={onClick}
        className={`p-2 rounded-md ${
          selected
            ? "bg-blue-100 border border-blue-500"
            : "bg-gray-100 hover:bg-gray-200 transition-colors"
        }`}
      >
        <Icon type={name} />
      </button>
    </Tooltip>
  );

  // Text Manipulation Panel
  const TextManipulationPanel = () => {
    if (!selectedTextId) return null;

    const selectedText = textElements.find((el) => el.id === selectedTextId);
    if (!selectedText) return null;

    const [localTextValue, setLocalTextValue] = useState(selectedText.text);

    useEffect(() => {
      if (selectedText) {
        setLocalTextValue(selectedText.text);
      }
    }, [selectedTextId, selectedText]);

    const handleTextUpdate = () => {
      updateTextElement(selectedTextId, () => ({ text: localTextValue }));
    };

    const changeTextColor = (newColor: string) => {
      updateTextElement(selectedTextId, () => ({ color: newColor }));
    };

    return (
      <div className="bg-white shadow-lg rounded-lg p-4 absolute left-4 bottom-20 z-10 border border-gray-300">
        <h3 className="font-bold text-sm mb-3">Text Properties</h3>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-600">Text Content</label>
            <div className="flex space-x-2">
              <textarea
                value={localTextValue}
                onChange={(e) => setLocalTextValue(e.target.value)}
                className="flex-1 p-1 border rounded text-sm w-full resize-none h-16"
              />
            </div>
            <button
              onClick={handleTextUpdate}
              className="mt-1 px-2 py-1 bg-blue-500 text-white rounded text-xs w-full"
            >
              Apply Text
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-600">Font</label>
            <select
              value={selectedText.font}
              onChange={(e) => {
                updateTextElement(selectedTextId, () => ({
                  font: e.target.value,
                }));
              }}
              className="w-full p-1 border rounded text-sm"
            >
              {fontOptions.map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </option>
              ))}
            </select>
          </div>

          {/* Size Control */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-xs text-gray-600">Size</label>
              <span className="text-xs">{selectedText.size}px</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={selectedText.size}
              onChange={(e) =>
                updateTextElement(selectedTextId, () => ({
                  size: parseInt(e.target.value),
                }))
              }
              className="w-full accent-blue-500"
            />
          </div>

          {/* Color Control */}
          <div className="space-y-1">
            <label className="text-xs text-gray-600">Color</label>
            <div className="flex flex-wrap gap-1">
              {colorPresets.map((preset) => (
                <button
                  key={preset.value}
                  className={`h-6 w-6 rounded-md ${
                    selectedText.color === preset.value
                      ? "ring-2 ring-blue-500"
                      : "border border-gray-300"
                  }`}
                  style={{ backgroundColor: preset.value }}
                  onClick={() => changeTextColor(preset.value)}
                  title={preset.label}
                />
              ))}

              {/* Color Picker Button */}
              <button
                onClick={() => {
                  setColor(selectedText.color);
                  setShowColorPicker(true);
                }}
                className="h-6 px-2 rounded-md border border-gray-300 bg-gray-100 text-xs flex items-center"
              >
                More...
              </button>
            </div>
          </div>

          {/* Delete Button */}
          <button
            onClick={() => {
              const filteredElements = textElements.filter(
                (el) => el.id !== selectedTextId
              );
              setTextElements(filteredElements);
              setSelectedTextId(null);

              const canvas = canvasRef.current;
              if (!canvas) return;

              const ctx = canvas.getContext("2d");
              if (!ctx) return;

              ctx.fillStyle = canvasColor;
              ctx.fillRect(0, 0, canvas.width, canvas.height);

              shapeElements.forEach((el) => drawShape(ctx, el));

              filteredElements.forEach((el) => {
                ctx.font = `${el.size}px ${el.font}`;
                ctx.fillStyle = el.color;
                ctx.fillText(el.text, el.x, el.y);
              });

              saveToHistory();
            }}
            className="w-full py-1 bg-red-500 text-white rounded-md text-sm mt-2 hover:bg-red-600"
          >
            Delete Text
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md">
        <div className="container mx-auto flex justify-between items-center py-3 px-4">
          <div className="flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            <h1 className="text-xl font-bold">DrawPro Studio</h1>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <ActionButton
              onClick={undo}
              disabled={historyIndex <= 0}
              title="Undo"
              icon="undo"
            />
            <ActionButton
              onClick={redo}
              disabled={historyIndex >= strokeHistory.length - 1}
              title="Redo"
              icon="redo"
            />
            <ActionButton
              onClick={clearCanvas}
              title="Clear Canvas"
              icon="clear"
            />
            <ActionButton
              onClick={exportImage}
              title="Export Image"
              icon="export"
            />
          </div>
          <button
            className="md:hidden p-2 rounded-full hover:bg-blue-500"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Icon type="menu" />
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white shadow-md p-4 space-y-4">
          <div className="flex justify-center space-x-4">
            <ActionButton
              onClick={undo}
              disabled={historyIndex <= 0}
              title="Undo"
              icon="undo"
            />
            <ActionButton
              onClick={redo}
              disabled={historyIndex >= strokeHistory.length - 1}
              title="Redo"
              icon="redo"
            />
            <ActionButton
              onClick={clearCanvas}
              title="Clear Canvas"
              icon="clear"
            />
            <ActionButton
              onClick={exportImage}
              title="Export Image"
              icon="export"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              "pen",
              "highlighter",
              "marker",
              "pencil",
              "text",
              "shape",
              "eraser",
              "select",
            ].map((t) => (
              <button
                key={t}
                onClick={() => setTool(t as DrawingTool)}
                className={`p-2 rounded ${
                  tool === t
                    ? "bg-blue-100 border border-blue-500"
                    : "bg-gray-100 hover:bg-gray-200"
                } flex flex-col items-center`}
              >
                <div className="mb-1">
                  <Icon type={t} />
                </div>
                <span className="text-xs capitalize">{t}</span>
              </button>
            ))}
          </div>

          {/* Eraser warning message */}
          {eraserWarning && tool === "eraser" && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded-md text-sm">
              Warning: Eraser is the same color as canvas background.
            </div>
          )}

          {tool === "shape" && (
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-2">
                {["rect", "circle", "line", "arrow", "star"].map((shape) => (
                  <button
                    key={shape}
                    onClick={() => setShapeType(shape as ShapeType)}
                    className={`p-2 rounded ${
                      shapeType === shape
                        ? "bg-blue-100 border border-blue-500"
                        : "bg-gray-100 hover:bg-gray-200"
                    } flex flex-col items-center`}
                  >
                    <div className="mb-1">
                      <Icon type={shape} />
                    </div>
                    <span className="text-xs capitalize">{shape}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={fillShape}
                    onChange={(e) => setFillShape(e.target.checked)}
                    className="rounded text-blue-500"
                  />
                  <span className="text-sm">Fill</span>
                </label>

                <div className="flex flex-col flex-1">
                  <label className="text-xs text-gray-600">Roughness</label>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.1"
                    value={roughness}
                    onChange={(e) => setRoughness(parseFloat(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {tool === "text" && (
            <div className="space-y-2">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text to place on canvas"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {fontOptions.map((font) => (
                  <option key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center space-x-4">
            <div className="flex flex-col flex-1">
              <label className="text-xs text-gray-600">Size</label>
              <input
                type="range"
                min="1"
                max="50"
                value={size}
                onChange={(e) => setSize(parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            {(tool === "pen" || tool === "marker") && (
              <div className="flex flex-col flex-1">
                <label className="text-xs text-gray-600">Opacity</label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center">
              <label className="text-xs text-gray-600 mb-1">Color</label>
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm"
                style={{ backgroundColor: color }}
              />
            </div>

            <div className="flex flex-col items-center">
              <label className="text-xs text-gray-600 mb-1">Canvas</label>
              <button
                onClick={() => setShowCanvasColorPicker(!showCanvasColorPicker)}
                className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm"
                style={{ backgroundColor: canvasColor }}
              />
            </div>
          </div>

          {showColorPicker && (
            <div className="fixed inset-0 flex items-center justify-center z-50 px-4 py-6">
              <div
                className="absolute inset-0 bg-black bg-opacity-30"
                onClick={handleOutsideClick}
              ></div>
              <div className="relative z-10">
                <ColorPickerComponent
                  currentColor={color}
                  onColorChange={(newColor) => {
                    setColor(newColor);
                    if (selectedTextId) {
                      updateTextElement(selectedTextId, () => ({
                        color: newColor,
                      }));
                    }
                  }}
                  onClose={() => setShowColorPicker(false)}
                />
              </div>
            </div>
          )}

          {showCanvasColorPicker && (
            <div className="fixed inset-0 flex items-center justify-center z-50 px-4 py-6">
              <div
                className="absolute inset-0 bg-black bg-opacity-30"
                onClick={handleOutsideClick}
              ></div>
              <div className="relative z-10">
                <ColorPickerComponent
                  currentColor={canvasColor}
                  onColorChange={setCanvasColor}
                  onClose={() => setShowCanvasColorPicker(false)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Desktop Toolbar */}
      <div className="hidden md:block bg-white shadow-md p-2">
        <div className="container mx-auto flex flex-wrap items-center gap-4">
          <div className="flex space-x-2">
            {[
              "pen",
              "highlighter",
              "marker",
              "pencil",
              "text",
              "shape",
              "eraser",
              "select",
            ].map((t) => (
              <ToolButton
                key={t}
                name={t}
                selected={tool === t}
                onClick={() => setTool(t as DrawingTool)}
              />
            ))}
          </div>

          {/* Eraser warning message for desktop */}
          {eraserWarning && tool === "eraser" && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded-md text-sm">
              Warning: Eraser is the same color as canvas background.
            </div>
          )}

          {tool === "shape" && (
            <div className="flex items-center space-x-2 border-l pl-2">
              <div className="flex space-x-1">
                {["rect", "circle", "line", "arrow", "star"].map((shape) => (
                  <ToolButton
                    key={shape}
                    name={shape}
                    selected={shapeType === shape}
                    onClick={() => setShapeType(shape as ShapeType)}
                  />
                ))}
              </div>

              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={fillShape}
                  onChange={(e) => setFillShape(e.target.checked)}
                  className="rounded text-blue-500"
                />
                <span>Fill</span>
              </label>

              <div className="flex items-center space-x-1">
                <span className="text-sm">Rough</span>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={roughness}
                  onChange={(e) => setRoughness(parseFloat(e.target.value))}
                  className="w-24 accent-blue-500"
                />
              </div>
            </div>
          )}

          {tool === "text" && (
            <div className="flex items-center space-x-2 border-l pl-2">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text"
                className="p-1 border rounded w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="p-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ fontFamily }}
              >
                {fontOptions.map((font) => (
                  <option key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center space-x-4 border-l pl-2">
            <div className="flex items-center space-x-1">
              <span className="text-sm">Size</span>
              <input
                type="range"
                min="1"
                max="50"
                value={size}
                onChange={(e) => setSize(parseInt(e.target.value))}
                className="w-24 accent-blue-500"
              />
            </div>

            {(tool === "pen" || tool === "marker") && (
              <div className="flex items-center space-x-1">
                <span className="text-sm">Opacity</span>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-24 accent-blue-500"
                />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3 border-l pl-2">
            <div className="relative">
              <Tooltip text="Color">
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-8 h-8 rounded-full border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: color }}
                ></button>
              </Tooltip>

              {showColorPicker && (
                <div className="absolute top-full left-0 mt-1 z-50">
                  <div
                    onClick={handleOutsideClick}
                    className="fixed inset-0 bg-black bg-opacity-30 z-40 md:bg-opacity-0 md:static md:inset-auto md:bg-transparent"
                  />
                  <div className="absolute top-0 left-0 z-50">
                    <ColorPickerComponent
                      currentColor={color}
                      onColorChange={(newColor) => {
                        setColor(newColor);
                        if (selectedTextId) {
                          updateTextElement(selectedTextId, () => ({
                            color: newColor,
                          }));
                        }
                      }}
                      onClose={() => setShowColorPicker(false)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <Tooltip text="Canvas Color">
                <button
                  onClick={() =>
                    setShowCanvasColorPicker(!showCanvasColorPicker)
                  }
                  className="w-8 h-8 rounded border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: canvasColor }}
                ></button>
              </Tooltip>

              {showCanvasColorPicker && (
                <div className="absolute top-full left-0 mt-1 z-50">
                  <div
                    onClick={handleOutsideClick}
                    className="fixed inset-0 bg-black bg-opacity-30 z-40 md:bg-opacity-0 md:static md:inset-auto md:bg-transparent"
                  />
                  <div className="absolute top-0 left-0 z-50">
                    <ColorPickerComponent
                      currentColor={canvasColor}
                      onColorChange={setCanvasColor}
                      onClose={() => setShowCanvasColorPicker(false)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative flex-1">
        <canvas
          ref={canvasRef}
          width={window.innerWidth}
          height={window.innerHeight - (window.innerWidth < 768 ? 120 : 100)}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          className="flex-1 cursor-crosshair touch-none"
        />

        {/* Text Manipulation Panel */}
        {selectedTextId && <TextManipulationPanel />}
      </div>

      {/* Status bar */}
      <div className="bg-gray-100 p-2 text-xs text-gray-500 flex justify-between">
        <div>DrawPro Studio v1.0</div>
        <div>Tool: {tool.charAt(0).toUpperCase() + tool.slice(1)}</div>
      </div>
    </div>
  );
};

export default App;
