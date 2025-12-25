import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';

import { PageExtension } from './extensions/PageExtension';
import { ParagraphNumbering } from './extensions/ParagraphNumbering';
import { StyleAttributes } from './extensions/StyleAttributes';
import { Pagination } from './extensions/Pagination';
import { CustomImage } from './extensions/CustomImage';

import { Toolbar } from './components/Toolbar';
import { HelpDialog } from './components/HelpDialog';
import { DonateDialog } from './components/DonateDialog';
import { ImageBubbleMenu } from './components/ImageBubbleMenu';
import { LinkBubbleMenu } from './components/LinkBubbleMenu';
import { LinkDialog } from './components/LinkDialog';
import { ImageTitleDialog } from './components/ImageTitleDialog';
import { ImageCaptionDialog } from './components/ImageCaptionDialog';
import { ImageTagDialog } from './components/ImageTagDialog';
import { ParagraphJumpDialog } from './components/ParagraphJumpDialog';
import { PageNavigator } from './components/PageNavigator';

export const EditorV3 = () => {
    const [helpOpen, setHelpOpen] = useState(false);
    const [donateOpen, setDonateOpen] = useState(false);
    const [linkOpen, setLinkOpen] = useState(false);
    const [imageTitleOpen, setImageTitleOpen] = useState(false);
    const [imageCaptionOpen, setImageCaptionOpen] = useState(false);
    const [imageTagOpen, setImageTagOpen] = useState(false);
    const [paragraphJumpOpen, setParagraphJumpOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'j') {
                e.preventDefault();
                setParagraphJumpOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Subscript,
            Superscript,
            Link.configure({ openOnClick: false }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
                alignments: ['left', 'center', 'right'],
            }),
            TextStyle,
            FontFamily,
            Color,
            CustomImage,
            PageExtension,
            ParagraphNumbering,
            StyleAttributes,
            Pagination,
        ],
        content: `
      <section class="page" data-page="1">
        <div class="page-inner">
          <p data-para="1" id="p1-1">React + Tiptap版エディタへようこそ。</p>
          <img src="/image/logo-himawari.png" class="img-m" />
          <p data-para="2" id="p1-2" class="inline-align-center">これは中央揃えの段落です。</p>
          <p data-para="3" id="p1-3">詳細は <a href="https://example.com">こちら</a> をご覧ください。</p>
        </div>
      </section>
    `,
    });

    return (
        <div id="left">
            <Toolbar
                editor={editor}
                onShowHelp={() => setHelpOpen(true)}
                onShowDonate={() => setDonateOpen(true)}
            />
            <div id="workspace">
                <PageNavigator editor={editor} />
                <div id="pages-container">
                    {editor && (
                        <>
                            <ImageBubbleMenu
                                editor={editor}
                                onEditTitle={() => setImageTitleOpen(true)}
                                onEditCaption={() => setImageCaptionOpen(true)}
                                onEditTag={() => setImageTagOpen(true)}
                            />
                            <LinkBubbleMenu editor={editor} onEdit={() => setLinkOpen(true)} />
                        </>
                    )}
                    <EditorContent editor={editor} />
                </div>
            </div>

            {helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} />}
            {donateOpen && <DonateDialog onClose={() => setDonateOpen(false)} />}
            {linkOpen && editor && <LinkDialog editor={editor} onClose={() => setLinkOpen(false)} />}
            {imageTitleOpen && editor && <ImageTitleDialog editor={editor} onClose={() => setImageTitleOpen(false)} />}
            {imageCaptionOpen && editor && <ImageCaptionDialog editor={editor} onClose={() => setImageCaptionOpen(false)} />}
            {imageTagOpen && editor && <ImageTagDialog editor={editor} onClose={() => setImageTagOpen(false)} />}
            {paragraphJumpOpen && editor && <ParagraphJumpDialog editor={editor} onClose={() => setParagraphJumpOpen(false)} />}
        </div>
    );
};

export default EditorV3;
