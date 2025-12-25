import React from 'react';
import { createRoot } from 'react-dom/client';
import EditorV3 from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
        <ErrorBoundary>
            <EditorV3 />
        </ErrorBoundary>
    );
}
