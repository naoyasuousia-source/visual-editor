import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { BaseDropdownMenu, MenuCheckboxItem } from '@/components/ui/BaseDropdownMenu';

export const ViewMenu: React.FC = () => {
    const [pageNumbers, setPageNumbers] = useState(true);
    const [paraNumbers, setParaNumbers] = useState(true);

    const togglePageNumbers = (checked: boolean) => {
        setPageNumbers(checked);
        document.body.classList.toggle('hide-page-numbers', !checked);
    };

    const toggleParaNumbers = (checked: boolean) => {
        setParaNumbers(checked);
        document.body.classList.toggle('hide-para-numbers', !checked);
    };

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
                checked={pageNumbers}
                onCheckedChange={togglePageNumbers}
            >
                ページ番号
            </MenuCheckboxItem>
            <MenuCheckboxItem
                checked={paraNumbers}
                onCheckedChange={toggleParaNumbers}
            >
                段落番号
            </MenuCheckboxItem>
        </BaseDropdownMenu>
    );
};
