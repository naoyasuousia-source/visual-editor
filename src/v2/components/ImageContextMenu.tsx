import React, { useEffect, useState, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { 
    Maximize2, 
    Smartphone, 
    Tablet, 
    Monitor, 
    Layout, 
    Square, 
    CheckSquare,
    Type,
    FileText,
    Tag,
    X
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface ImageContextMenuProps {
    editor: Editor | null;
}

export const ImageContextMenu: React.FC<ImageContextMenuProps> = ({ editor }) => {
    const { openDialog } = useAppStore();
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!editor) return;

        const handleContextMenu = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Tiptap image node detection
            if (target.tagName === 'IMG' && target.closest('.ProseMirror')) {
                e.preventDefault();
                setIsVisible(true);
                
                // Keep menu within viewport
                let x = e.clientX;
                let y = e.clientY;
                
                // Select the image
                const pos = editor.view.posAtDOM(target, 0);
                if (pos !== null) {
                    const tr = editor.state.tr.setSelection(
                        editor.state.selection.constructor.create(editor.state.doc, pos)
                    );
                    editor.view.dispatch(tr);
                }

                setPosition({ x, y });
            } else {
                setIsVisible(false);
            }
        };

        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsVisible(false);
            }
        };
        
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('click', handleClick);
        document.addEventListener('scroll', () => setIsVisible(false), true);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('click', handleClick);
            document.removeEventListener('scroll', () => setIsVisible(false), true);
        };
    }, [editor]);

    if (!isVisible || !editor) return null;

    const setImageWidth = (width: string) => {
        editor.chain().focus().updateAttributes('image', { width }).run();
        setIsVisible(false);
    };

    const toggleBorder = () => {
        const currentBorder = editor.getAttributes('image').border;
        editor.chain().focus().updateAttributes('image', { border: !currentBorder }).run();
        setIsVisible(false);
    };

    const MenuItem: React.FC<{ 
        icon: React.ReactNode, 
        label: string, 
        onClick: () => void, 
        shortcut?: string 
    }> = ({ icon, label, onClick, shortcut }) => (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors gap-3"
        >
            <span className="text-gray-500">{icon}</span>
            <span className="flex-1 text-left">{label}</span>
            {shortcut && <span className="text-xs text-gray-400">{shortcut}</span>}
        </button>
    );

    const MenuDivider = () => <div className="h-px bg-gray-200 my-1" />;

    const SubMenuLabel: React.FC<{ label: string }> = ({ label }) => (
        <div className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {label}
        </div>
    );

    return (
        <div 
            ref={menuRef}
            className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[200px] animate-in fade-in zoom-in-95 duration-100"
            style={{ top: position.y, left: position.x }}
        >
            <SubMenuLabel label="サイズ変更" />
            <MenuItem icon={<Smartphone className="w-4 h-4" />} label="XS (15%)" onClick={() => setImageWidth('15%')} />
            <MenuItem icon={<Tablet className="w-4 h-4" />} label="S (30%)" onClick={() => setImageWidth('30%')} />
            <MenuItem icon={<Monitor className="w-4 h-4" />} label="M (50%)" onClick={() => setImageWidth('50%')} />
            <MenuItem icon={<Layout className="w-4 h-4" />} label="L (80%)" onClick={() => setImageWidth('80%')} />
            <MenuItem icon={<Maximize2 className="w-4 h-4" />} label="XL (100%)" onClick={() => setImageWidth('100%')} />
            
            <MenuDivider />
            
            <MenuItem 
                icon={editor.getAttributes('image').border ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />} 
                label="枠線を表示" 
                onClick={toggleBorder} 
            />
            
            <MenuDivider />

            <MenuItem 
                icon={<Type className="w-4 h-4" />} 
                label="タイトルを編集..." 
                onClick={() => {
                    openDialog('image-title');
                    setIsVisible(false);
                }} 
            />
            <MenuItem 
                icon={<FileText className="w-4 h-4" />} 
                label="キャプションを編集..." 
                onClick={() => {
                    openDialog('image-caption');
                    setIsVisible(false);
                }} 
            />
            <MenuItem 
                icon={<Tag className="w-4 h-4" />} 
                label="タグを編集..." 
                onClick={() => {
                    openDialog('image-tag');
                    setIsVisible(false);
                }} 
            />
            
            <MenuDivider />
            
            <MenuItem 
                icon={<X className="w-4 h-4 text-red-500" />} 
                label="メニューを閉じる" 
                onClick={() => setIsVisible(false)} 
            />
        </div>
    );
};
