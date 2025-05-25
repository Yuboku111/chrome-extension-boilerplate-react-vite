import 'webextension-polyfill';
import { exampleThemeStorage } from '@extension/storage';

exampleThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

console.log('Background loaded');
console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");

const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY';

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'capture-selection') {
    captureAndProcess(msg.rect, sender.tab?.windowId).then(answer => {
      sendResponse({ answer });
    });
    return true;
  }
  return false;
});

async function captureAndProcess(
  rect: { x: number; y: number; width: number; height: number; devicePixelRatio: number },
  windowId?: number,
) {
  const screenshot = await chrome.tabs.captureVisibleTab(windowId, { format: 'png' });
  const cropped = await cropImage(screenshot, rect);
  return askChatGPT(cropped);
}

function cropImage(
  dataUrl: string,
  rect: { x: number; y: number; width: number; height: number; devicePixelRatio: number },
) {
  return new Promise<string>(resolve => {
    fetch(dataUrl)
      .then(r => r.blob())
      .then(blob => createImageBitmap(blob))
      .then(bitmap => {
        const scale = rect.devicePixelRatio;
        const canvas = new OffscreenCanvas(rect.width * scale, rect.height * scale);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(
          bitmap,
          rect.x * scale,
          rect.y * scale,
          rect.width * scale,
          rect.height * scale,
          0,
          0,
          rect.width * scale,
          rect.height * scale,
        );
        canvas.convertToBlob({ type: 'image/png' }).then(b => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(b);
        });
      });
  });
}

async function askChatGPT(imageDataUrl: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Please solve the problem in this image.' },
            { type: 'image_url', image_url: { url: imageDataUrl } },
          ],
        },
      ],
    }),
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}
