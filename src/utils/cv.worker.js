/* eslint-disable no-restricted-globals */

// Define message types
const MSG_LOAD = 'load';
const MSG_PROCESS = 'process';

let isCvLoaded = false;

// Helper to ensure cv is ready
const waitForCv = () => {
    return new Promise((resolve) => {
        if (self.cv && self.cv.Mat) {
            resolve();
        } else {
            // Poll if script loaded but cv not fully initialized
            const interval = setInterval(() => {
                if (self.cv && self.cv.Mat) {
                    clearInterval(interval);
                    resolve();
                }
            }, 50);
        }
    });
};

self.onmessage = async (e) => {
    const { type, payload } = e.data;

    try {
        switch (type) {
            case MSG_LOAD:
                if (isCvLoaded) {
                    self.postMessage({ type: MSG_LOAD, success: true });
                    return;
                }

                try {
                    self.importScripts('/libs/opencv.js');

                    // Wait for initialization
                    await waitForCv();

                    isCvLoaded = true;
                    self.postMessage({ type: MSG_LOAD, success: true });
                } catch (error) {
                    console.error('Worker: Failed to load OpenCV', error);
                    self.postMessage({ type: MSG_LOAD, success: false, error: error.message });
                }
                break;

            case MSG_PROCESS:
                if (!isCvLoaded) {
                    throw new Error('OpenCV not loaded');
                }

                const { imagePixels, maskPixels, width, height } = payload;

                // 1. Read input data as RGBA (cv.Mat inputs from ImageData are RGBA)
                const src = new self.cv.Mat(height, width, self.cv.CV_8UC4);
                src.data.set(imagePixels.data);

                // 2. Convert Source to RGB (inpaint requires 3 channels, doesn't work with Alpha)
                const srcRGB = new self.cv.Mat();
                self.cv.cvtColor(src, srcRGB, self.cv.COLOR_RGBA2RGB);

                // 3. Prepare Mask (RGBA -> Gray)
                const maskSrc = new self.cv.Mat(height, width, self.cv.CV_8UC4);
                maskSrc.data.set(maskPixels.data);

                const mask = new self.cv.Mat();
                self.cv.cvtColor(maskSrc, mask, self.cv.COLOR_RGBA2GRAY);
                self.cv.threshold(mask, mask, 10, 255, self.cv.THRESH_BINARY);

                // 4. Inpaint (on RGB image)
                const dstRGB = new self.cv.Mat();
                self.cv.inpaint(srcRGB, mask, dstRGB, 3, self.cv.INPAINT_TELEA);

                // 5. Convert Result back to RGBA for canvas display
                const dst = new self.cv.Mat();
                self.cv.cvtColor(dstRGB, dst, self.cv.COLOR_RGB2RGBA);

                // 6. Transfer output
                const resultData = new Uint8ClampedArray(dst.data);

                self.postMessage({
                    type: MSG_PROCESS,
                    success: true,
                    payload: {
                        pixels: resultData,
                        width: width,
                        height: height
                    }
                }, [resultData.buffer]);

                // Cleanup
                src.delete(); srcRGB.delete();
                maskSrc.delete(); mask.delete();
                dstRGB.delete(); dst.delete();
                break;

            default:
                console.warn('Unknown message type:', type);
        }
    } catch (error) {
        // Handle cases where error is not an Error object (OpenCV sometimes throws integers/strings)
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Worker Error:', errorMessage);
        self.postMessage({ type: type, success: false, error: errorMessage });
    }
};
