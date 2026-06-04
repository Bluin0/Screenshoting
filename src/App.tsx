import { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { DrawingCanvas } from './components/DrawingCanvas';

export default function App() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [screenshotX, setScreenshotX] = useState<number>(1);

  const handleImageReady = (dataUrl: string) => {
    setCapturedImage(dataUrl);
  };

  const handleOnSave = (savedX: string) => {
    // If saved suffix is a pure number, auto-increment it!
    const parsed = parseInt(savedX, 10);
    if (!isNaN(parsed)) {
      setScreenshotX(parsed + 1);
    }
  };

  return (
    <div className="w-full min-h-screen bg-black select-none">
      {capturedImage === null ? (
        <LandingPage
          onImageCaptured={handleImageReady}
          screenshotX={screenshotX}
          setScreenshotX={setScreenshotX}
        />
      ) : (
        <DrawingCanvas
          backgroundImageUrl={capturedImage}
          onClose={() => setCapturedImage(null)}
          onSave={handleOnSave}
          defaultSecIndex={screenshotX}
        />
      )}
    </div>
  );
}

