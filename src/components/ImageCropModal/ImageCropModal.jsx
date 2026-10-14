import { useState, useRef, useEffect, useCallback } from "react";
import styles from "./ImageCropModal.module.scss";

// Output resolution when canvas exports the cropped image
const OUTPUT = {
  avatar: { w: 400, h: 400, displayW: 300, displayH: 300 },
  cover: { w: 1200, h: 300, displayW: 560, displayH: 140 },
};

const ImageCropModal = ({ src, type = "avatar", onApply, onCancel }) => {
  const { w: outW, h: outH, displayW, displayH } = OUTPUT[type] || OUTPUT.avatar;

  const imgRef = useRef(null);
  const dragRef = useRef(null);

  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 }); // offset from center
  const [isDragging, setIsDragging] = useState(false);

  // Minimum zoom so image always covers the crop container
  const minZoom = useCallback(() => {
    if (!natural.w || !natural.h) return 1;
    return Math.max(displayW / natural.w, displayH / natural.h);
  }, [natural, displayW, displayH]);

  // Clamp position so image never leaves crop area
  const clamp = useCallback((x, y, z = zoom) => {
    if (!natural.w) return { x: 0, y: 0 };
    const imgW = natural.w * z;
    const imgH = natural.h * z;
    const maxX = Math.max(0, (imgW - displayW) / 2);
    const maxY = Math.max(0, (imgH - displayH) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }, [zoom, natural, displayW, displayH]);

  const handleLoad = (e) => {
    const w = e.target.naturalWidth;
    const h = e.target.naturalHeight;
    setNatural({ w, h });
    const mz = Math.max(displayW / w, displayH / h);
    setZoom(mz);
    setPos({ x: 0, y: 0 });
  };

  // ── Mouse drag ───────────────────────────────────────────────
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, posX: pos.x, posY: pos.y };
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos(clamp(dragRef.current.posX + dx, dragRef.current.posY + dy));
  }, [clamp]);

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
    setIsDragging(false);
  }, []);

  // ── Touch drag ───────────────────────────────────────────────
  const handleTouchStart = (e) => {
    const t = e.touches[0];
    setIsDragging(true);
    dragRef.current = { startX: t.clientX, startY: t.clientY, posX: pos.x, posY: pos.y };
  };

  const handleTouchMove = useCallback((e) => {
    if (!dragRef.current) return;
    e.preventDefault();
    const t = e.touches[0];
    const dx = t.clientX - dragRef.current.startX;
    const dy = t.clientY - dragRef.current.startY;
    setPos(clamp(dragRef.current.posX + dx, dragRef.current.posY + dy));
  }, [clamp]);

  const handleTouchEnd = useCallback(() => {
    dragRef.current = null;
    setIsDragging(false);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // ── Zoom slider ──────────────────────────────────────────────
  const handleZoom = (e) => {
    const z = parseFloat(e.target.value);
    setZoom(z);
    setPos((p) => clamp(p.x, p.y, z));
  };

  // ── Export via canvas ────────────────────────────────────────
  const handleApply = () => {
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");

    // Image center in container coords: (displayW/2 + pos.x, displayH/2 + pos.y)
    // Image top-left in container coords: center - natural*zoom/2
    // Crop top-left in natural image coords:
    const srcX = natural.w / 2 - (displayW / 2 + pos.x) / zoom;
    const srcY = natural.h / 2 - (displayH / 2 + pos.y) / zoom;
    const srcW = displayW / zoom;
    const srcH = displayH / zoom;

    ctx.drawImage(imgRef.current, srcX, srcY, srcW, srcH, 0, 0, outW, outH);

    canvas.toBlob((blob) => {
      const file = new File([blob], "image.jpg", { type: "image/jpeg" });
      const previewUrl = URL.createObjectURL(blob);
      onApply(file, previewUrl);
    }, "image/jpeg", 0.92);
  };

  const mz = minZoom();
  const maxZoom = Math.max(mz * 3, 2);

  return (
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>{type === "avatar" ? "Chỉnh ảnh đại diện" : "Chỉnh ảnh bìa"}</h3>
          <button className={styles.closeBtn} onClick={onCancel} aria-label="Đóng">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <p className={styles.hint}>Kéo để căn chỉnh vị trí ảnh</p>

        {/* Crop viewport */}
        <div className={styles.cropWrapper}>
          <div
            className={`${styles.cropArea} ${type === "avatar" ? styles.circle : ""} ${isDragging ? styles.dragging : ""}`}
            style={{ width: displayW, height: displayH }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              ref={imgRef}
              src={src}
              alt=""
              className={styles.cropImg}
              style={{
                transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) scale(${zoom})`,
              }}
              onLoad={handleLoad}
              draggable={false}
            />
          </div>
        </div>

        {/* Zoom control */}
        <div className={styles.zoomRow}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className={styles.zoomIcon}>
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input
            type="range"
            className={styles.zoomSlider}
            min={mz}
            max={maxZoom}
            step={0.001}
            value={zoom}
            onChange={handleZoom}
          />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className={styles.zoomIcon}>
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM10 7H9v2H7v1h2v2h1v-2h2V9h-2V7z"/>
          </svg>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            Hủy
          </button>
          <button type="button" className={styles.applyBtn} onClick={handleApply}>
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
