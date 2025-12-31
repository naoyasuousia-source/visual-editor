import React from 'react';
import { ChevronDown } from 'lucide-react';
import { BaseDropdownMenu, MenuCheckboxItem } from '@/components/ui/BaseDropdownMenu';
import { useNumberToggle } from '@/hooks/useParagraphNumberToggle';

export const ViewMenu: React.FC = () => {
    const { 
        showPageNumbers, 
        showParaNumbers, 
        togglePageNumbers, 
        toggleParaNumbers 
    } = useNumberToggle();

    return (
        <BaseDropdownMenu
            id="view"
            trigger={
                <button
                    type="button"
                    className="px-2 py-1 rounded hover:bg-gray-200 transition-colors border border-gray-300 bg-white flex items-center gap-1 text-sm h-[36px]"
                >
                    表示 <ChevronDown className="w-3 h-3" />
                </button>
            }
        >
            <MenuCheckboxItem
                checked={showPageNumbers}
                onCheckedChange={togglePageNumbers}
            >
                ページ番号
            </MenuCheckboxItem>
            <MenuCheckboxItem
                checked={showParaNumbers}
                onCheckedChange={toggleParaNumbers}
            >
                段落番号
            </MenuCheckboxItem>
        </BaseDropdownMenu>
    );
};
