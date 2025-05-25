let overlay: HTMLDivElement | null = null;
let box: HTMLDivElement | null = null;
let startX = 0;
let startY = 0;
let sendRes: ((answer: { answer: string }) => void) | null = null;

export const initSelectionListener = () => {
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'start-selection') {
      sendRes = sendResponse;
      startSelection();
      return true;
    }
    return false;
  });
};

function startSelection() {
  if (overlay) return;
  overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.right = '0';
  overlay.style.bottom = '0';
  overlay.style.background = 'rgba(0,0,0,0.3)';
  overlay.style.cursor = 'crosshair';
  overlay.style.zIndex = '2147483647';

  box = document.createElement('div');
  box.style.position = 'absolute';
  box.style.border = '2px dashed #fff';
  overlay.appendChild(box);

  overlay.addEventListener('mousedown', onMouseDown);
  overlay.addEventListener('mousemove', onMouseMove);
  overlay.addEventListener('mouseup', onMouseUp);
  document.body.appendChild(overlay);
}

function onMouseDown(e: MouseEvent) {
  startX = e.clientX;
  startY = e.clientY;
  updateBox(startX, startY, 0, 0);
}

function onMouseMove(e: MouseEvent) {
  if (!box) return;
  updateBox(startX, startY, e.clientX - startX, e.clientY - startY);
}

function onMouseUp(e: MouseEvent) {
  const rect = {
    x: Math.min(startX, e.clientX),
    y: Math.min(startY, e.clientY),
    width: Math.abs(e.clientX - startX),
    height: Math.abs(e.clientY - startY),
    devicePixelRatio: window.devicePixelRatio,
  };
  cleanup();

  chrome.runtime.sendMessage({ type: 'capture-selection', rect }, res => {
    sendRes?.(res);
    sendRes = null;
  });
}

function updateBox(x: number, y: number, w: number, h: number) {
  if (!box) return;
  box.style.left = `${Math.min(x, x + w)}px`;
  box.style.top = `${Math.min(y, y + h)}px`;
  box.style.width = `${Math.abs(w)}px`;
  box.style.height = `${Math.abs(h)}px`;
}

function cleanup() {
  if (overlay) {
    overlay.remove();
    overlay = null;
    box = null;
  }
}
