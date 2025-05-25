import { sampleFunction } from '@src/sampleFunction';
import { initSelectionListener } from '@src/selection';

console.log('content script loaded');

// Shows how to call a function defined in another module
sampleFunction();

// Initialize listener for area selection
initSelectionListener();
