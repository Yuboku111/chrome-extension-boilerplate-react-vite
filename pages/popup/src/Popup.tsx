import '@src/Popup.css';
import { useEffect, useState } from 'react';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { t } from '@extension/i18n';
import { ToggleButton } from '@extension/ui';

const notificationOptions = {
  type: 'basic',
  iconUrl: chrome.runtime.getURL('icon-34.png'),
  title: 'Injecting content script error',
  message: 'You cannot inject script here!',
} as const;

const Popup = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const logo = isLight ? 'popup/logo_vertical.svg' : 'popup/logo_vertical_dark.svg';
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    startSelection();
  }, []);

  const startSelection = async () => {
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true });
    chrome.tabs.sendMessage(tab.id!, { type: 'start-selection' }, res => {
      if (res?.answer) {
        setAnswer(res.answer);
      }
    });
  };

  const goGithubSite = () =>
    chrome.tabs.create({ url: 'https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite' });

  const injectContentScript = async () => {
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true });

    if (tab.url!.startsWith('about:') || tab.url!.startsWith('chrome:')) {
      chrome.notifications.create('inject-error', notificationOptions);
    }

    await chrome.scripting
      .executeScript({
        target: { tabId: tab.id! },
        files: ['/content-runtime/index.iife.js'],
      })
      .catch(err => {
        // Handling errors related to other paths
        if (err.message.includes('Cannot access a chrome:// URL')) {
          chrome.notifications.create('inject-error', notificationOptions);
        }
      });
  };

  return (
    <div className={`App ${isLight ? 'bg-slate-50' : 'bg-gray-800'}`}>
      <header className={`App-header ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
        <button onClick={goGithubSite}>
          <img src={chrome.runtime.getURL(logo)} className="App-logo" alt="logo" />
        </button>
        <p className="mt-2">{answer ? answer : 'Drag to select a question on the page.'}</p>
        <div className="mt-4 flex flex-col gap-2 items-center">
          <button
            className={
              'font-bold py-1 px-4 rounded shadow hover:scale-105 ' +
              (isLight ? 'bg-blue-200 text-black' : 'bg-gray-700 text-white')
            }
            onClick={startSelection}>
            Select Area Again
          </button>
          <button
            className={
              'font-bold py-1 px-4 rounded shadow hover:scale-105 ' +
              (isLight ? 'bg-blue-200 text-black' : 'bg-gray-700 text-white')
            }
            onClick={injectContentScript}>
            Inject Sample Content Script
          </button>
        </div>
        <ToggleButton className="mt-2">{t('toggleTheme')}</ToggleButton>
      </header>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
