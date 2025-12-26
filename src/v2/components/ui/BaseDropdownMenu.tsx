import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface BaseDropdownMenuProps {
    id?: string;
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
    id,
    trigger,
    children,
    align = 'start'
}) => {
    const { activeMenu, setActiveMenu } = useAppStore();
    const isOpen = id ? activeMenu === id : undefined;

    const handleOpenChange = (open: boolean) => {
        if (id) {
            setActiveMenu(open ? id : null);
        }
    };

    const handleMouseEnter = () => {
        if (id && activeMenu === null) {
            setActiveMenu(id);
        }
    };

    return (
        <DropdownMenu.Root open={isOpen} onOpenChange={handleOpenChange}>
            <DropdownMenu.Trigger asChild onMouseEnter={handleMouseEnter}>
                {trigger}
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="min-w-max bg-white rounded-md border border-gray-200 shadow-xl p-1 z-[2001] animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
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
    className?: string;
    children: React.ReactNode;
}

export const MenuItem: React.FC<MenuItemProps> = ({ onSelect, disabled, shortcut, className, children }) => {
    return (
        <DropdownMenu.Item
            className={`relative flex items-center justify-between px-4 py-1.5 text-sm outline-none cursor-pointer select-none rounded hover:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors ${className || ''}`}
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
    className?: string;
    hideChevron?: boolean;
}

export const SubMenu: React.FC<SubMenuProps> = ({ trigger, children, className, hideChevron }) => {
    const hasCustomPadding = className?.includes('p-') || className?.includes('px-') || className?.includes('py-');
    const defaultPadding = hasCustomPadding ? '' : 'px-4 py-1.5';

    return (
        <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className={`relative flex items-center gap-2 text-sm outline-none cursor-pointer select-none rounded hover:bg-gray-100 data-[state=open]:bg-gray-100 transition-colors ${defaultPadding} ${className || ''}`}>
                <span>{trigger}</span>
                {!hideChevron && <ChevronRight className="w-3 h-3 text-gray-400 ml-auto" />}
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal>
                <DropdownMenu.SubContent
                    className="min-w-max bg-white rounded-md border border-gray-200 shadow-xl p-1 z-[2002] animate-in fade-in-0 zoom-in-95 data-[side=right]:slide-in-from-left-2 data-[side=left]:slide-in-from-right-2"
                    sideOffset={8}
                >
                    {children}
                </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
        </DropdownMenu.Sub>
    );
};

/**
 * チェックボックス付きメニューアイテム
 */
interface MenuCheckboxItemProps {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    children: React.ReactNode;
}

export const MenuCheckboxItem: React.FC<MenuCheckboxItemProps> = ({ checked, onCheckedChange, children }) => {
    return (
        <DropdownMenu.CheckboxItem
            className="relative flex items-center px-4 py-1.5 text-sm outline-none cursor-pointer select-none rounded hover:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors pl-8"
            checked={checked}
            onCheckedChange={onCheckedChange}
        >
            <DropdownMenu.ItemIndicator className="absolute left-2 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-blue-600" />
            </DropdownMenu.ItemIndicator>
            {children}
        </DropdownMenu.CheckboxItem>
    );
};

/**
 * セパレーター
 */
export const MenuSeparator: React.FC = () => {
    return <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />;
};
