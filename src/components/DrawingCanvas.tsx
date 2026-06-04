import React, { useRef, useEffect, useState } from 'react';
import {
  Pencil,
  ArrowRight,
  Minus,
  Square,
  Highlighter,
  Type,
  X,
  Download,
  Copy,
  CloudUpload,
  Share2,
  Printer,
  Undo2,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  Point,
  DrawingElement,
  CropRect,
  DragHandle,
  ToolType,
  ColorPreset
} from '../types';

interface DrawingCanvasProps {
  backgroundImageUrl: string | null;
  onClose: () => void;
  onSave?: (savedFilename: string) => void;
  defaultSecIndex: number;
}

const COLOR_PRESETS: ColorPreset[] = [
  { name: 'Red', value: '#ff1744' },
  { name: 'Orange', value: '#ff9100' },
  { name: 'Yellow', value: '#ffea00' },
  { name: 'Green', value: '#00e676' },
  { name: 'Cyan', value: '#00e5ff' },
  { name: 'Blue', value: '#2979ff' },
  { name: 'Violet', value: '#d500f9' },
  { name: 'White', value: '#ffffff' },
  { name: 'Grey', value: '#9e9e9e' },
  { name: 'Black', value: '#212121' }
];

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  backgroundImageUrl,
  onClose,
  onSave,
  defaultSecIndex
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

  // Core Lightshot dimensions
  const [windowSize, setWindowSize] = useState({ width: 800, height: 600 });
  const [cropRect, setCropRect] = useState<CropRect | null>(null);

  // Interactive Tools state
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [activeColor, setActiveColor] = useState<string>('#ff1744'); // Classic Red default
  const [strokeThickness, setStrokeThickness] = useState<number>(3);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Tracking drawing elements
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [undoStack, setUndoStack] = useState<DrawingElement[][]>([]);

  // Dragging / Interaction mechanics
  const [dragPhase, setDragPhase] = useState<'idle' | 'drawing_crop' | 'dragging_rect' | 'resizing_rect' | 'drawing_stroke'>('idle');
  const [activeHandle, setActiveHandle] = useState<DragHandle>(null);
  const [dragStartMouse, setDragStartMouse] = useState<Point>({ x: 0, y: 0 });
  const [dragStartRect, setDragStartRect] = useState<CropRect | null>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });

  // Floating text edit state
  const [textInput, setTextInput] = useState<{ x: number; y: number; width: number; val: string } | null>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // Filename Customization state (Screenshot_X.png)
  const [screenshotX, setScreenshotX] = useState<string>(String(defaultSecIndex));
  const [isEditingX, setIsEditingX] = useState<boolean>(false);

  // Overlay Alert Notifications (e.g. copied to clipboard!)
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; text: string } | null>(null);
  const [uploadingState, setUploadingState] = useState<{ status: 'idle' | 'uploading' | 'completed'; link?: string }>({ status: 'idle' });

  // Load the background screenshot
  useEffect(() => {
    if (backgroundImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setBgImage(img);
      };
      img.src = backgroundImageUrl;
    }
  }, [backgroundImageUrl]);

  // Adjust to viewport size
  useEffect(() => {
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Sync canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = windowSize.width;
      canvas.height = windowSize.height;
      drawEverything();
    }
  }, [windowSize, bgImage, cropRect, elements, activeTool, activeColor, strokeThickness]);

  // Handle escape to cancel or Ctrl+C / Ctrl+S mappings!
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndo();
      } else if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
        if (cropRect) {
          e.preventDefault();
          handleCopy();
        }
      } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        if (cropRect) {
          e.preventDefault();
          handleSave();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cropRect, elements, screenshotX]);

  // Redraw canvas routine
  const drawEverything = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw static screenshot underlay
    if (bgImage) {
      ctx.drawImage(bgImage, 0, 0, w, h);
    } else {
      // Background gradient fail-safe
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Draw Screen Shade Mask
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, w, h);

    if (!cropRect) return;

    // 3. Cut out Crop Rectangle (Clear mask / redraw static image portion strictly)
    if (bgImage) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
      ctx.clip();
      ctx.drawImage(bgImage, 0, 0, w, h);
      ctx.restore();
    } else {
      ctx.clearRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
    }

    // 4. Draw crop rectangle dashed boundary
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
    // Outer solid matching bounding box
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.setLineDash([]);
    ctx.strokeRect(cropRect.x - 1, cropRect.y - 1, cropRect.width + 2, cropRect.height + 2);
    ctx.restore();

    // 5. Draw 8 square grab handles at boundary checkpoints
    const handles = getHandleCoordinates(cropRect);
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#3b82f6'; // Clean blue border (tailwind blue-500)
    ctx.lineWidth = 1.5;
    Object.entries(handles).forEach(([_, pt]) => {
      ctx.beginPath();
      ctx.rect(pt.x - 3.5, pt.y - 3.5, 7, 7);
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();

    // 6. Draw Annotations clipped inside selected CropRect
    ctx.save();
    ctx.beginPath();
    ctx.rect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
    ctx.clip();

    elements.forEach((el) => {
      ctx.strokeStyle = el.color;
      ctx.lineWidth = el.thickness;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      switch (el.type) {
        case 'pencil':
        case 'marker': {
          if (el.points.length < 1) return;
          if (el.type === 'marker') {
            ctx.save();
            ctx.globalAlpha = 0.45; // Semitransparent highlighter
            ctx.lineWidth = el.thickness * 3.5;
          }
          ctx.beginPath();
          ctx.moveTo(el.points[0].x, el.points[0].y);
          el.points.forEach((pt) => {
            ctx.lineTo(pt.x, pt.y);
          });
          ctx.stroke();
          if (el.type === 'marker') {
            ctx.restore();
          }
          break;
        }
        case 'line': {
          if (el.points.length < 2) return;
          ctx.beginPath();
          ctx.moveTo(el.points[0].x, el.points[0].y);
          ctx.lineTo(el.points[1].x, el.points[1].y);
          ctx.stroke();
          break;
        }
        case 'rect': {
          if (el.points.length < 2) return;
          const x1 = el.points[0].x;
          const y1 = el.points[0].y;
          const x2 = el.points[1].x;
          const y2 = el.points[1].y;
          ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
          break;
        }
        case 'arrow': {
          if (el.points.length < 2) return;
          drawArrow(ctx, el.points[0].x, el.points[0].y, el.points[1].x, el.points[1].y, el.thickness);
          break;
        }
        case 'text': {
          if (el.points.length > 0 && el.text) {
            ctx.fillStyle = el.color;
            ctx.shadowBlur = 4;
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            const txtSz = Math.max(14, el.thickness * 4.5);
            ctx.font = `bold ${txtSz}px sans-serif`;
            ctx.textBaseline = 'top';
            ctx.fillText(el.text, el.points[0].x, el.points[0].y);
            ctx.shadowBlur = 0;
          }
          break;
        }
      }
    });
    ctx.restore();
  };

  // Utility to locate the 8 resize handle coordinates
  const getHandleCoordinates = (rect: CropRect) => {
    const { x, y, width: w, height: h } = rect;
    return {
      tl: { x, y },
      tc: { x: x + w / 2, y },
      tr: { x: x + w, y },
      ml: { x, y: y + h / 2 },
      mr: { x: x + w, y: y + h / 2 },
      bl: { x, y: y + h },
      bc: { x: x + w / 2, y: y + h },
      br: { x: x + w, y: y + h }
    };
  };

  // Simple Arrow drawing code
  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, thickness: number) => {
    const headlen = Math.max(14, thickness * 3.5);
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Arrowhead shape points
    ctx.beginPath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI * 6), toY - headlen * Math.sin(angle - Math.PI * 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI * 6), toY - headlen * Math.sin(angle + Math.PI * 6));
    ctx.fill();
  };

  // Convert client coordinate into Point
  const getMouseCoord = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  // Identify handle hovered or clicked
  const detectTargetUnderMouse = (pt: Point): { handle: DragHandle; isInside: boolean } => {
    if (!cropRect) return { handle: null, isInside: false };

    // 1. Check handle collisions (radius distance tolerance)
    const handles = getHandleCoordinates(cropRect);
    const tolerance = 9; // hit circle radius
    for (const [key, val] of Object.entries(handles)) {
      const dx = pt.x - val.x;
      const dy = pt.y - val.y;
      if (Math.sqrt(dx * dx + dy * dy) <= tolerance) {
        return { handle: key as DragHandle, isInside: false };
      }
    }

    // 2. Check if inside crop boundary box
    const isInside =
      pt.x >= cropRect.x &&
      pt.x <= cropRect.x + cropRect.width &&
      pt.y >= cropRect.y &&
      pt.y <= cropRect.y + cropRect.height;

    return { handle: null, isInside };
  };

  // Update cursor hover CSS property based on positions
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getMouseCoord(e);
    setMousePos(pt);

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (dragPhase === 'idle') {
      const { handle, isInside } = detectTargetUnderMouse(pt);
      if (handle) {
        const cursorMap: Record<string, string> = {
          tl: 'nwse-resize',
          tc: 'ns-resize',
          tr: 'nesw-resize',
          ml: 'ew-resize',
          mr: 'ew-resize',
          bl: 'nesw-resize',
          bc: 'ns-resize',
          br: 'nwse-resize'
        };
        canvas.style.cursor = cursorMap[handle] || 'default';
      } else if (isInside) {
        if (activeTool === 'select') {
          canvas.style.cursor = 'move';
        } else {
          canvas.style.cursor = 'crosshair';
        }
      } else {
        canvas.style.cursor = 'crosshair'; // Outside allows drawing new crop
      }
    }

    // Process ongoing drag sequences
    if (dragPhase === 'drawing_crop') {
      const parentW = windowSize.width;
      const parentH = windowSize.height;
      const currentX = Math.max(0, Math.min(pt.x, parentW));
      const currentY = Math.max(0, Math.min(pt.y, parentH));

      setCropRect({
        x: Math.min(dragStartMouse.x, currentX),
        y: Math.min(dragStartMouse.y, currentY),
        width: Math.abs(dragStartMouse.x - currentX),
        height: Math.abs(dragStartMouse.y - currentY)
      });
    } else if (dragPhase === 'dragging_rect' && dragStartRect) {
      const dx = pt.x - dragStartMouse.x;
      const dy = pt.y - dragStartMouse.y;
      
      const newX = Math.max(0, Math.min(dragStartRect.x + dx, windowSize.width - dragStartRect.width));
      const newY = Math.max(0, Math.min(dragStartRect.y + dy, windowSize.height - dragStartRect.height));

      setCropRect({
        ...dragStartRect,
        x: newX,
        y: newY
      });
    } else if (dragPhase === 'resizing_rect' && dragStartRect && activeHandle) {
      const dx = pt.x - dragStartMouse.x;
      const dy = pt.y - dragStartMouse.y;

      let { x, y, width: w, height: h } = dragStartRect;

      switch (activeHandle) {
        case 'tl':
          x = Math.max(0, Math.min(x + dx, dragStartRect.x + dragStartRect.width - 15));
          y = Math.max(0, Math.min(y + dy, dragStartRect.y + dragStartRect.height - 15));
          w = dragStartRect.x + dragStartRect.width - x;
          h = dragStartRect.y + dragStartRect.height - y;
          break;
        case 'tc':
          y = Math.max(0, Math.min(y + dy, dragStartRect.y + dragStartRect.height - 15));
          h = dragStartRect.y + dragStartRect.height - y;
          break;
        case 'tr':
          w = Math.max(15, Math.min(w + dx, windowSize.width - x));
          y = Math.max(0, Math.min(y + dy, dragStartRect.y + dragStartRect.height - 15));
          h = dragStartRect.y + dragStartRect.height - y;
          break;
        case 'ml':
          x = Math.max(0, Math.min(x + dx, dragStartRect.x + dragStartRect.width - 15));
          w = dragStartRect.x + dragStartRect.width - x;
          break;
        case 'mr':
          w = Math.max(15, Math.min(w + dx, windowSize.width - x));
          break;
        case 'bl':
          x = Math.max(0, Math.min(x + dx, dragStartRect.x + dragStartRect.width - 15));
          w = dragStartRect.x + dragStartRect.width - x;
          h = Math.max(15, Math.min(h + dy, windowSize.height - y));
          break;
        case 'bc':
          h = Math.max(15, Math.min(h + dy, windowSize.height - y));
          break;
        case 'br':
          w = Math.max(15, Math.min(w + dx, windowSize.width - x));
          h = Math.max(15, Math.min(h + dy, windowSize.height - y));
          break;
      }

      setCropRect({ x, y, width: w, height: h });
    } else if (dragPhase === 'drawing_stroke' && elements.length > 0) {
      // Draw standard shapes
      const updated = [...elements];
      const activeEl = updated[updated.length - 1];

      if (activeEl.type === 'pencil' || activeEl.type === 'marker') {
        activeEl.points.push(pt);
      } else {
        // Line, Arrow, Rect only have 2 checkpoints (start & end)
        if (activeEl.points.length === 1) {
          activeEl.points.push(pt);
        } else {
          activeEl.points[1] = pt;
        }
      }
      setElements(updated);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // Only process main left clicks

    // Close open text fields if they click elsewhere
    if (textInput) {
      finalizeTextInput();
    }

    const pt = getMouseCoord(e);
    const { handle, isInside } = detectTargetUnderMouse(pt);

    if (activeTool === 'select') {
      if (handle) {
        setDragPhase('resizing_rect');
        setActiveHandle(handle);
        setDragStartMouse(pt);
        setDragStartRect(cropRect);
      } else if (isInside && cropRect) {
        setDragPhase('dragging_rect');
        setDragStartMouse(pt);
        setDragStartRect(cropRect);
      } else {
        // Clicking outside selection drags to draw a fresh new crop rectangular bounds
        setDragPhase('drawing_crop');
        setDragStartMouse(pt);
        setCropRect(null);
        setElements([]); // Wipe edits relative to older crop
      }
    } else {
      // We are in drawing mode (Pencil, rect, arrow, etc)
      if (isInside && cropRect) {
        if (activeTool === 'text') {
          // Open direct text typing box
          setTextInput({
            x: pt.x,
            y: pt.y - 8,
            width: Math.min(250, cropRect.x + cropRect.width - pt.x - 10),
            val: ''
          });
        } else {
          // Start drawing physical lines
          setDragPhase('drawing_stroke');
          setUndoStack([]); // clear redo on new edits
          
          const newEl: DrawingElement = {
            id: Math.random().toString(36).substr(2, 9),
            type: activeTool as Exclude<ToolType, 'select'>,
            points: [pt],
            color: activeColor,
            thickness: strokeThickness
          };
          setElements([...elements, newEl]);
        }
      } else {
        // Clicked outside bounds -> initiate fresh crop select
        setDragPhase('drawing_crop');
        setDragStartMouse(pt);
        setCropRect(null);
        setElements([]);
        setActiveTool('select');
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragPhase === 'drawing_crop') {
      if (cropRect) {
        // Clean micro-rectangular glitches
        if (cropRect.width < 12 || cropRect.height < 12) {
          setCropRect(null);
        } else {
          // Normal sized crop, we default back to helper select tool for adjusting handles
          setActiveTool('select');
        }
      }
    } else if (dragPhase === 'drawing_stroke') {
      // Filter out single clicked points to avoid invisible strokes
      const last = elements[elements.length - 1];
      if (last && (last.type === 'pencil' || last.type === 'marker') && last.points.length < 2) {
        setElements(elements.slice(0, -1));
      } else {
        // Save history state to allow Undos
        setUndoStack([]);
      }
    }

    setDragPhase('idle');
    setActiveHandle(null);
  };

  // Convert currently selected bounding box + annotations to standalone canvas blob!
  const generateExportBlob = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!cropRect) return resolve(null);

      const canvas = document.createElement('canvas');
      canvas.width = cropRect.width;
      canvas.height = cropRect.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);

      // Translate coordinates x,y offsets relative to crop boundary coordinates
      ctx.save();
      ctx.translate(-cropRect.x, -cropRect.y);

      // 1. Draw sliced capture wallpaper portion
      if (bgImage) {
        ctx.drawImage(bgImage, 0, 0, windowSize.width, windowSize.height);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
      }

      // 2. Overlay drawing strokes that lie inside
      elements.forEach((el) => {
        ctx.strokeStyle = el.color;
        ctx.lineWidth = el.thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        switch (el.type) {
          case 'pencil':
          case 'marker': {
            if (el.points.length < 1) return;
            if (el.type === 'marker') {
              ctx.save();
              ctx.globalAlpha = 0.45;
              ctx.lineWidth = el.thickness * 3.5;
            }
            ctx.beginPath();
            ctx.moveTo(el.points[0].x, el.points[0].y);
            el.points.forEach((pt) => {
              ctx.lineTo(pt.x, pt.y);
            });
            ctx.stroke();
            if (el.type === 'marker') {
              ctx.restore();
            }
            break;
          }
          case 'line': {
            if (el.points.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(el.points[0].x, el.points[0].y);
            ctx.lineTo(el.points[1].x, el.points[1].y);
            ctx.stroke();
            break;
          }
          case 'rect': {
            if (el.points.length < 2) return;
            ctx.strokeRect(el.points[0].x, el.points[0].y, el.points[1].x - el.points[0].x, el.points[1].y - el.points[0].y);
            break;
          }
          case 'arrow': {
            if (el.points.length < 2) return;
            drawArrow(ctx, el.points[0].x, el.points[0].y, el.points[1].x, el.points[1].y, el.thickness);
            break;
          }
          case 'text': {
            if (el.points.length > 0 && el.text) {
              ctx.fillStyle = el.color;
              ctx.shadowBlur = 4;
              ctx.shadowColor = 'rgba(0,0,0,0.5)';
              const txtSz = Math.max(14, el.thickness * 4.5);
              ctx.font = `bold ${txtSz}px sans-serif`;
              ctx.textBaseline = 'top';
              ctx.fillText(el.text, el.points[0].x, el.points[0].y);
              ctx.shadowBlur = 0;
            }
            break;
          }
        }
      });

      ctx.restore();
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  };

  // COPY DIRECTLY TO CLIPBOARD - User explicitly misses this!
  const handleCopy = async () => {
    if (!cropRect) return;
    try {
      showToast('info', 'Generando captura para copiar...');
      const blob = await generateExportBlob();
      if (!blob) {
        showToast('error', 'Error al generar la imagen.');
        return;
      }
      
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      showToast('success', '¡Copiado al portapapeles directamente!');
      
      // Auto-close overlay on success
      setTimeout(() => {
        onClose();
      }, 200);
    } catch (err) {
      console.error(err);
      showToast('error', 'Tu navegador bloqueó copiar imágenes en iFrame. Descárgala o ábrela en pestaña nueva.');
    }
  };

  // SAVE AS Screenshot_X.png
  const handleSave = async () => {
    if (!cropRect) return;
    const blob = await generateExportBlob();
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Custom name constraint Screenshot_X.png
    const sanitizedX = screenshotX.trim() || 'X';
    const finalFilename = `Screenshot_${sanitizedX}.png`;
    link.download = finalFilename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('success', `Guardado como "${finalFilename}"`);
    if (onSave) {
      onSave(sanitizedX);
    }

    // Auto-close overlay on success
    setTimeout(() => {
      onClose();
    }, 200);
  };

  // SIMULATE CLOUD SHARE UPLOAD
  const handleCloudUpload = async () => {
    if (!cropRect) return;
    setUploadingState({ status: 'uploading' });
    showToast('info', 'Subiendo recorte al servidor en la nube de Lightshot...');

    setTimeout(() => {
      // Simulate random unique shorturl id
      const randomId = Math.random().toString(36).substring(2, 8);
      const fakeLink = `https://prnt.sc/web-${randomId}`;
      setUploadingState({ status: 'completed', link: fakeLink });
      showToast('success', '¡Enlace subido con éxito!');
    }, 2000);
  };

  // TRADITIONAL WINDOWS PRINT CUTOUT
  const handlePrint = async () => {
    if (!cropRect) return;
    const blob = await generateExportBlob();
    if (!blob) return;

    const blobUrl = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    };
    iframe.src = blobUrl;
  };

  // SHARE INTEGRATION
  const handleShare = async () => {
    if (!cropRect) return;
    const blob = await generateExportBlob();
    if (!blob) return;

    const file = new File([blob], `Screenshot_${screenshotX}.png`, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Lightshot Capture',
          text: 'Te comparto esta captura de pantalla.'
        });
      } catch (err) {
        console.log('Share canceled or failing', err);
      }
    } else {
      showToast('info', 'La API de compartir no está soportada en este explorador. ¡Usa Copiar o Guardar!');
    }
  };

  // UNDO LAST DRAWING OBJECT
  const handleUndo = () => {
    if (elements.length === 0) return;
    const prev = [...elements];
    const removed = prev.pop();
    if (removed) {
      setUndoStack([removed, ...undoStack]);
    }
    setElements(prev);
  };

  // Helper trigger inline popup
  const showToast = (type: 'success' | 'info' | 'error', text: string) => {
    setNotification({ type: type === 'error' ? 'info' : type, text });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Inline TEXT Box finishing
  const finalizeTextInput = () => {
    if (!textInput || !textInputRef.current) return;
    const val = textInput.current.trim();
    if (val && cropRect) {
      const txtEl: DrawingElement = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'text',
        points: [{ x: textInput.x, y: textInput.y }],
        color: activeColor,
        thickness: strokeThickness,
        text: val
      };
      setElements([...elements, txtEl]);
    }
    setTextInput(null);
  };

  // Keyboard textarea helper
  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      finalizeTextInput();
    }
    if (e.key === 'Escape') {
      setTextInput(null);
    }
  };

  // Auto-focus the annotation text area
  useEffect(() => {
    if (textInput && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [textInput]);

  // Layout positions for Lightshot float menus
  const getMenuStyles = () => {
    if (!cropRect) return { show: false, vertical: {}, horizontal: {} };

    // Set floating distance gaps
    const gap = 8;
    const screenWidth = windowSize.width;
    const screenHeight = windowSize.height;

    // Sidebar coordinates (vertical toolbar)
    let vLeft = cropRect.x + cropRect.width + gap;
    let vTop = cropRect.y;

    // Boundary check right edge
    if (vLeft + 44 > screenWidth) {
      vLeft = cropRect.x + cropRect.width - 44 - gap;
      if (vLeft < cropRect.x) {
        vLeft = cropRect.x + 2;
      }
    }
    // Boundary check top edge
    if (vTop + 300 > screenHeight) {
      vTop = Math.max(10, screenHeight - 310);
    }

    // Action menu coordinates (horizontal toolbar)
    const actionMenuWidth = 340;
    let hLeft = cropRect.x + cropRect.width - actionMenuWidth;
    let hTop = cropRect.y + cropRect.height + gap;

    // Boundary check bottom edge
    if (hTop + 45 > screenHeight) {
      hTop = cropRect.y - 45 - gap;
      if (hTop < 0) {
        hTop = cropRect.y + cropRect.height - 42; // place it inside-bottom
      }
    }
    // Boundary check left bounds
    if (hLeft < 0) {
      hLeft = Math.max(8, cropRect.x);
    }

    return {
      show: true,
      vertical: {
        left: `${vLeft}px`,
        top: `${vTop}px`
      },
      horizontal: {
        left: `${hLeft}px`,
        top: `${hTop}px`
      }
    };
  };

  const menus = getMenuStyles();

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 select-none overflow-hidden bg-black/90 active:select-none touch-none"
      style={{ width: `${windowSize.width}px`, height: `${windowSize.height}px` }}
    >
      {/* 1. Underlying interactive Canvas Layer */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="absolute inset-0 block select-none"
      />

      {/* 2. Drag area guides & Dimension tag inside canvas */}
      {cropRect && (
        <div
          className="absolute rounded bg-slate-950/80 px-2 py-0.5 font-mono text-[11px] font-bold tracking-tight text-white shadow-xl border border-slate-700/50 pointer-events-none"
          style={{
            left: `${cropRect.x + 4}px`,
            top: `${cropRect.y - 25 > 10 ? cropRect.y - 25 : cropRect.y + 6}px`
          }}
        >
          {Math.round(cropRect.width)} x {Math.round(cropRect.height)} px
        </div>
      )}

      {/* 3. Text field layout inside region */}
      {textInput && (
        <textarea
          ref={textInputRef}
          value={textInput.val}
          onChange={(e) => setTextInput({ ...textInput, val: e.target.value })}
          onKeyDown={handleTextKeyDown}
          onBlur={finalizeTextInput}
          placeholder="Escribe texto..."
          className="absolute z-50 p-1 resize-none bg-black/60 font-medium border-2 border-dashed shadow-2xl focus:outline-none placeholder:text-gray-400 font-sans"
          style={{
            left: `${textInput.x}px`,
            top: `${textInput.y}px`,
            width: `${textInput.width}px`,
            height: '60px',
            color: activeColor,
            borderColor: activeColor,
            fontSize: `${Math.max(14, strokeThickness * 4.5)}px`
          }}
        />
      )}

      {/* 4. Top customization bar for Screenshot Prefix "Screenshot_X.png" */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md bg-[#24283b] shadow-2xl flex items-center gap-3.5 z-10 transition-all duration-300">
        <span className="text-zinc-400 text-xs font-semibold tracking-wider uppercase font-sans">
          Archivo:
        </span>
        <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-md border border-white/5">
          <span className="text-zinc-400 font-mono text-xs font-medium">Screenshot_</span>
          {isEditingX ? (
            <input
              type="text"
              value={screenshotX}
              onChange={(e) => setScreenshotX(e.target.value.replace(/[^a-zA-Z0-9_\-]/g, ''))}
              onBlur={() => setIsEditingX(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingX(false)}
              className="text-blue-300 bg-transparent text-xs font-mono font-bold w-20 focus:outline-none border-b border-blue-400 pb-0.5"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditingX(true)}
              className="text-blue-300 text-xs font-mono font-bold hover:bg-white/10 transition rounded px-1.5 cursor-pointer"
              title="Haz clic para cambiar el nombre de X"
            >
              {screenshotX}
            </button>
          )}
          <span className="text-zinc-400 font-mono text-xs font-medium">.png</span>
        </div>
        <div className="h-4 w-[1px] bg-white/10" />
        <span className="text-zinc-400 text-xs font-medium hidden sm:inline">
          {cropRect ? "Anota el recorte" : "Arrastra el ratón para recortar la pantalla"}
        </span>
      </div>

      {/* 5. FLOATING TOOLBARS (Only trigger when crop box is active) */}
      {menus.show && cropRect && (
        <>
          {/* A. Vertical Drawing Sidebar */}
          <div
            className="absolute flex flex-col items-center bg-[#2d2d2d] border border-white/10 shadow-lg p-1 gap-1 z-30 transition-all scale-100 origin-center rounded"
            style={menus.vertical}
          >
            {/* Ink Pen */}
            <button
              onClick={() => setActiveTool('pencil')}
              className={`p-2 rounded transition duration-200 cursor-pointer ${
                activeTool === 'pencil'
                  ? 'bg-blue-600 text-white shadow-inner'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
              title="Lápiz / Mano alzada (P)"
            >
              <Pencil size={17} />
            </button>

            {/* Straight Line */}
            <button
              onClick={() => setActiveTool('line')}
              className={`p-2 rounded transition duration-200 cursor-pointer ${
                activeTool === 'line'
                  ? 'bg-blue-600 text-white shadow-inner'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
              title="Línea recta (L)"
            >
              <Minus className="rotate-[135deg]" size={17} />
            </button>

            {/* Arrows */}
            <button
              onClick={() => setActiveTool('arrow')}
              className={`p-2 rounded transition duration-200 cursor-pointer ${
                activeTool === 'arrow'
                  ? 'bg-blue-600 text-white shadow-inner'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
              title="Flecha para señalar (A)"
            >
              <ArrowRight size={17} />
            </button>

            {/* Square Bounding Borders */}
            <button
              onClick={() => setActiveTool('rect')}
              className={`p-2 rounded transition duration-200 cursor-pointer ${
                activeTool === 'rect'
                  ? 'bg-blue-600 text-white shadow-inner'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
              title="Rectángulo hueco (R)"
            >
              <Square size={17} />
            </button>

            {/* Highlighter Marker */}
            <button
              onClick={() => setActiveTool('marker')}
              className={`p-2 rounded transition duration-200 cursor-pointer ${
                activeTool === 'marker'
                  ? 'bg-blue-600 text-white shadow-inner'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
              title="Marcador fluorescente (H)"
            >
              <Highlighter size={17} />
            </button>

            {/* Direct Text writer */}
            <button
              onClick={() => setActiveTool('text')}
              className={`p-2 rounded transition duration-200 cursor-pointer ${
                activeTool === 'text'
                  ? 'bg-blue-600 text-white shadow-inner'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
              title="Escribir texto (T)"
            >
              <Type size={17} />
            </button>

            <div className="w-[80%] h-[1px] bg-white/10 my-0.5" />

            {/* Thickness toggle selector */}
            <div className="flex flex-col gap-1.5 p-1">
              <button
                onClick={() => setStrokeThickness(2)}
                className={`w-4 h-4 rounded-full flex items-center justify-center transition border ${
                  strokeThickness === 2 ? 'border-blue-400 bg-blue-400/20' : 'border-zinc-700 hover:border-zinc-500'
                }`}
                title="Grosor fino"
              >
                <div className="w-1 h-1 rounded-full bg-white" />
              </button>
              <button
                onClick={() => setStrokeThickness(4.5)}
                className={`w-4 h-4 rounded-full flex items-center justify-center transition border ${
                  strokeThickness === 4.5 ? 'border-blue-400 bg-blue-400/20' : 'border-zinc-700 hover:border-zinc-500'
                }`}
                title="Grosor medio"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-white" />
              </button>
              <button
                onClick={() => setStrokeThickness(8)}
                className={`w-4 h-4 rounded-full flex items-center justify-center transition border ${
                  strokeThickness === 8 ? 'border-blue-400 bg-blue-400/20' : 'border-zinc-700 hover:border-zinc-500'
                }`}
                title="Grosor grueso"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white" />
              </button>
            </div>

            <div className="w-[80%] h-[1px] bg-white/10 my-0.5" />

            {/* Selected Color Palette Circle */}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-7 h-7 rounded-full border-2 border-white/60 hover:scale-110 transition shadow-md flex items-center justify-center cursor-pointer overflow-hidden"
                style={{ backgroundColor: activeColor }}
                title="Elegir Color"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-white/40 border border-black/10" />
              </button>

              {/* Popover Selection list */}
              {showColorPicker && (
                <div className="absolute right-12 top-1/2 -translate-y-1/2 flex flex-grid grid-cols-2 gap-1.5 bg-zinc-950/95 border border-zinc-800 p-2 rounded-lg shadow-2xl w-24">
                  <div className="grid grid-cols-2 gap-1.5 w-full">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          setActiveColor(preset.value);
                          setShowColorPicker(false);
                        }}
                        className={`w-6 h-6 rounded-full cursor-pointer relative shadow hover:scale-110 transition-transform ${
                          activeColor === preset.value ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-zinc-900' : ''
                        }`}
                        style={{ backgroundColor: preset.value }}
                        title={preset.name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Backspace undo click */}
            <button
              onClick={handleUndo}
              disabled={elements.length === 0}
              className={`p-2 rounded transition ${
                elements.length === 0
                  ? 'text-zinc-700 cursor-not-allowed'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer'
              }`}
              title="Deshacer trazo (Ctrl+Z)"
            >
              <Undo2 size={17} />
            </button>
          </div>

          {/* B. Horizontal Action Dashboard (Bottombar) */}
          <div
            className="absolute flex items-center bg-[#2d2d2d] border border-white/10 shadow-lg p-1 gap-1 z-30 transition-all origin-right rounded"
            style={menus.horizontal}
          >
            {/* Cancel screenshot bounds */}
            <button
              onClick={onClose}
              className="px-2.5 h-8 flex items-center justify-center hover:bg-white/10 rounded text-white/70 text-xs font-medium gap-1 cursor-pointer transition"
              title="Cerrar / Cancelar (Esc)"
            >
              <X size={14} className="shrink-0" /> X
            </button>

            <div className="w-px h-4 bg-white/10 mx-0.5" />

            {/* Simulate Cloud Upload link */}
            <button
              onClick={handleCloudUpload}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded transition cursor-pointer"
              title="Subir a prntscr.com (Guardado en simulacion de nube)"
            >
              <CloudUpload size={16} />
            </button>

            {/* Open share options */}
            <button
              onClick={handleShare}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded transition cursor-pointer"
              title="Compartir con amigos"
            >
              <Share2 size={16} />
            </button>

            {/* Open print menu standard popup */}
            <button
              onClick={handlePrint}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded transition cursor-pointer"
              title="Imprimir recorte"
            >
              <Printer size={16} />
            </button>

            <div className="w-px h-4 bg-white/10 mx-0.5" />

            {/* Direct clipboard COPY */}
            <button
              onClick={handleCopy}
              className="px-2.5 h-8 flex items-center justify-center hover:bg-white/10 text-white rounded text-xs font-medium gap-1.5 transition cursor-pointer text-nowrap"
              title="Copiar directamente al portapapeles sin guardar (Ctrl+C)"
            >
              <Copy size={14} className="text-zinc-400" />
              Copiar
            </button>

            {/* Save file down */}
            <button
              onClick={handleSave}
              className="px-3 h-8 flex items-center justify-center hover:bg-blue-600 rounded text-white bg-blue-600/20 text-xs font-bold gap-1.5 transition shadow-sm cursor-pointer text-nowrap"
              title="Guardar archivo como Screenshot_X.png (Ctrl+S)"
            >
              <Download size={14} />
              SAVE
            </button>
          </div>
        </>
      )}

      {/* 6. Upload progress animation panel */}
      {uploadingState.status !== 'idle' && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-250">
            <h4 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
              <CloudUpload className="text-sky-400" />
              Subiendo a los servidores de Lightshot
            </h4>

            {uploadingState.status === 'uploading' ? (
              <div className="my-5">
                <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1.5">
                  <span>Procesando imagen PNG...</span>
                  <span className="animate-pulse">Envíando...</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-2.5 overflow-hidden border border-zinc-800">
                  <div className="bg-gradient-to-r from-sky-400 to-indigo-500 h-2.5 rounded-full animate-[progress_2s_ease-out_forwards]" style={{ width: '100%' }} />
                </div>
                <p className="text-zinc-500 text-[11px] mt-2 italic font-sans leading-relaxed">
                  Bypass de compresión aplicado. Limpiando metadatos para optimizar velocidad.
                </p>
              </div>
            ) : (
              <div className="my-4 space-y-4">
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block mb-1 font-sans">
                    Enlace de captura público:
                  </span>
                  <a
                    href={uploadingState.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 font-mono text-sm break-all font-semibold hover:underline block truncate"
                  >
                    {uploadingState.link}
                  </a>
                </div>
                <div className="flex gap-2.5">
                  <button
                    onClick={() => {
                      if (uploadingState.link) {
                        navigator.clipboard.writeText(uploadingState.link);
                        showToast('success', '¡Enlace copiado al portapapeles!');
                      }
                    }}
                    className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition cursor-pointer"
                  >
                    Copiar Enlace
                  </button>
                  <button
                    onClick={() => setUploadingState({ status: 'idle' })}
                    className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
                  >
                    Terminar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. Overlay Toast alerts */}
      {notification && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 flex items-center gap-4 text-white z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
          <div className="text-sm font-sans font-medium">{notification.text}</div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/60 font-mono">ESC to cancel</span>
          </div>
        </div>
      )}
    </div>
  );
};
