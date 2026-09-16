"use client";
import { useEffect, useRef, useState } from "react";

export default function QRCodeJoin({ code }: { code: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    void import("qrcode").then((qr) => {
      if (active && canvas.current) return qr.toCanvas(canvas.current, `${window.location.origin}/?room=${code}`, { width: 208, margin: 2, errorCorrectionLevel: "M" });
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [code]);
  return <div className="qr-block">{error ? <p>Nhập mã {code} tại trang chủ.</p> : <canvas ref={canvas} role="img" aria-label={`Quét QR để vào phòng ${code}`} />}
    <p>Quét để vào phòng</p></div>;
}
