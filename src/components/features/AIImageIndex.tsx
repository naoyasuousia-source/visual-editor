import React, { useEffect, useState } from 'react';
import { Editor } from '@tiptap/react';
import { useAppStore } from '@/store/useAppStore';

interface AIImageIndexProps {
    editor: Editor;
}

interface ImageMeta {
    src: string;
    title: string;
    caption: string;
    tag: string;
    anchor: string;
}

export const AIImageIndex: React.FC<AIImageIndexProps> = ({ editor }) => {
    const { isWordMode } = useAppStore();
    const [metaList, setMetaList] = useState<ImageMeta[]>([]);

    useEffect(() => {
        if (!editor || isWordMode) {
            setMetaList([]);
            return;
        }

        const updateIndex = () => {
            const newMetaList: ImageMeta[] = [];
            const { doc } = editor.state;

            let lastParaId = '';

            doc.descendants((node, pos) => {
                if (node.type.name === 'paragraph' || node.type.name === 'heading') {
                    lastParaId = node.attrs.id || '';
                }

                if (node.type.name === 'image') {
                    newMetaList.push({
                        src: node.attrs.src || '',
                        title: node.attrs.title || '',
                        caption: node.attrs.caption || '',
                        tag: node.attrs.tag || '',
                        anchor: lastParaId,
                    });
                }
            });

            setMetaList(newMetaList);
        };

        // Update on every dot change
        editor.on('update', updateIndex);
        updateIndex(); // Initial sync

        return () => {
            editor.off('update', updateIndex);
        };
    }, [editor, isWordMode]);

    if (isWordMode) return null;

    return (
        <div id="ai-image-index" className="hidden" aria-hidden="true">
            {metaList.map((meta, index) => (
                <div
                    key={`${meta.src}-${index}`}
                    className="figure-meta"
                    data-src={meta.src}
                    data-title={meta.title}
                    data-caption={meta.caption}
                    data-tag={meta.tag}
                    data-anchor={meta.anchor}
                />
            ))}
        </div>
    );
};
