import React from 'react';
import { createRoot } from 'react-dom/client';
import EditorV3 from '@/app/App';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import '@/styles/index.css';
import '@/styles/content.css';

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
        <ErrorBoundary>
            <EditorV3 />
        </ErrorBoundary>
    );
}
