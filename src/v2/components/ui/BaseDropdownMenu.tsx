import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface BaseDropdownMenuProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    align?: 'start' | 'center' | 'end';
}

/**
 * Radix UIベースの共通ドロップダウンメニューコンポーネント
 * 
 * 【特徴】
 * - アクセシビリティ完全対応（キーボードナビゲーション）
 * - ネストメニュー対応
 * - Tailwind CSSで完全スタイル制御
 */
export const BaseDropdownMenu: React.FC<BaseDropdownMenuProps> = ({
    trigger,
    children,
    align = 'start'
}) => {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                {trigger}
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="min-w-[220px] bg-white rounded-md border border-gray-200 shadow-xl p-1 z-[2001] animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
                    align={align}
                    sideOffset={4}
                >
                    {children}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
};

/**
 * メニューアイテム
 */
interface MenuItemProps {
    onSelect?: () => void;
    disabled?: boolean;
    shortcut?: string;
    children: React.ReactNode;
}

export const MenuItem: React.FC<MenuItemProps> = ({ onSelect, disabled, shortcut, children }) => {
    return (
        <DropdownMenu.Item
            className="relative flex items-center justify-between px-4 py-1.5 text-sm outline-none cursor-pointer select-none rounded hover:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors"
            onSelect={onSelect}
            disabled={disabled}
        >
            <span>{children}</span>
            {shortcut && (
                <span className="text-[10px] text-gray-400 font-mono ml-4">{shortcut}</span>
            )}
        </DropdownMenu.Item>
    );
};

/**
 * サブメニュー
 */
interface SubMenuProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
}

export const SubMenu: React.FC<SubMenuProps> = ({ trigger, children }) => {
    return (
        <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className="relative flex items-center justify-between px-4 py-1.5 text-sm outline-none cursor-pointer select-none rounded hover:bg-gray-100 data-[state=open]:bg-gray-100 transition-colors">
                <span>{trigger}</span>
                <ChevronRight className="w-3 h-3 text-gray-400 ml-auto" />
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal>
                <DropdownMenu.SubContent
                    className="min-w-[180px] bg-white rounded-md border border-gray-200 shadow-xl p-1 z-[2002] animate-in fade-in-0 zoom-in-95 data-[side=right]:slide-in-from-left-2 data-[side=left]:slide-in-from-right-2"
                    sideOffset={8}
                >
                    {children}
                </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
        </DropdownMenu.Sub>
    );
};

/**
 * セパレーター
 */
export const MenuSeparator: React.FC = () => {
    return <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />;
};
