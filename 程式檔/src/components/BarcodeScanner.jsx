import React, { useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, ScanFace } from 'lucide-react';

export default function BarcodeScanner({ onScan, onClose }) {
    useEffect(() => {
        // 配置 html5-qrcode
        const scanner = new Html5QrcodeScanner(
            "inventory-barcode-reader",
            { 
               fps: 10, 
               qrbox: { width: 300, height: 150 }, 
               formatsToSupport: [
                   Html5QrcodeSupportedFormats.EAN_13, 
                   Html5QrcodeSupportedFormats.EAN_8, 
                   Html5QrcodeSupportedFormats.UPC_A, 
                   Html5QrcodeSupportedFormats.UPC_E, 
                   Html5QrcodeSupportedFormats.CODE_128,
                   Html5QrcodeSupportedFormats.QR_CODE
               ]
            },
            false
        );
        
        scanner.render(
            (decodedText) => {
                scanner.clear().then(() => {
                    onScan(decodedText);
                }).catch(e => {
                    console.error("Failed to clear html5-qrcode scanner", e);
                    onScan(decodedText);
                });
            },
            (errorMessage) => {
                // ignore background scanning errors
            }
        );

        return () => {
             scanner.clear().catch(e => console.log("Unmount cleanup clear:", e));
        };
    }, [onScan]);

    return (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center animate-fade-in backdrop-blur-xl">
            <button 
                onClick={onClose} 
                className="absolute top-10 right-6 z-10 w-12 h-12 bg-white/10 text-white flex items-center justify-center rounded-full hover:bg-white/20 active:scale-90 transition-all shadow-xl backdrop-blur-md"
            >
                <X size={24} />
            </button>
             
            <div className="w-full max-w-sm mb-6 text-center space-y-3 px-6 animate-slide-up">
                <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-2 border border-amber-500/30">
                    <ScanFace size={32} />
                </div>
                <h2 className="text-white text-2xl font-black tracking-widest drop-shadow-md">商品條碼感應</h2>
                <p className="text-white/60 text-sm font-bold">請將鏡頭對準實體商品背面之條碼<br/>系統將在讀取後自動為您完成建檔</p>
            </div>
             
            <div className="w-full max-w-sm px-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div id="inventory-barcode-reader" className="w-full bg-stone-900 rounded-[2.5rem] overflow-hidden border-2 border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)] [&_button]:!bg-amber-600 [&_button]:!text-white [&_button]:!rounded-xl [&_button]:!px-4 [&_button]:!py-2 [&_button]:!font-bold [&_button]:!border-none [&_button]:!shadow-md [&_select]:!bg-stone-800 [&_select]:!text-white [&_select]:!rounded-xl [&_select]:!px-3 [&_select]:!py-2 [&_a]:!hidden"></div>
            </div>
        </div>
    );
}
