import { useRef, useState } from 'react';

export default function CompareSlider({ beforeSrc, afterSrc }) {
  const [pos, setPos] = useState(50);
  const ref = useRef(null);

  const onMove = (clientX) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPos((x / rect.width) * 100);
  };

  return (
    <div
      ref={ref}
      className="relative w-full max-w-lg aspect-[3/4] mx-auto rounded-xl overflow-hidden cursor-ew-resize select-none"
      onMouseMove={(e) => e.buttons === 1 && onMove(e.clientX)}
      onMouseDown={(e) => onMove(e.clientX)}
      onTouchMove={(e) => onMove(e.touches[0].clientX)}
    >
      <img src={afterSrc} alt="Sau try-on" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img src={beforeSrc} alt="Trước" className="absolute inset-0 w-full h-full object-cover max-w-none" style={{ width: ref.current?.offsetWidth }} />
      </div>
      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow" style={{ left: `${pos}%` }} />
    </div>
  );
}
