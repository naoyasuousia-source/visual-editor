import { getParagraphChooserElement, getFontChooserElement, getHighlightControlElement } from '../globals.js';
import { applyBlockElement } from '../editor/formatting.js';
import { switchMode, getMode } from '../core/router.js';
// DOM Elements
const getFileDropdownElement = () => document.querySelector('.file-dropdown');
const getNestedDropdownElements = () => document.querySelectorAll('.nested-dropdown');
function adjustMenuPositionSafe(submenu) {
    // Reset to default to measure natural size/position
    submenu.style.left = '';
    submenu.style.right = '';
    const rect = submenu.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    // Check if it overflows the right edge
    if (rect.right > windowWidth) {
        const container = submenu.offsetParent;
        if (!container)
            return; // Should not happen for visible elements
        const containerRect = container.getBoundingClientRect();
        // If we align right edge to container right edge (right: 0), 
        // the left edge relative to viewport will be: containerRect.right - rect.width
        const proposedLeft = containerRect.right - rect.width;
        if (proposedLeft < 0) {
            // Flipping causes left overflow. Force fit to window left.
            // submenu.style.left should be relative to container left.
            // We want (containerRect.left + style.left) = 0
            // style.left = -containerRect.left
            submenu.style.left = `${-containerRect.left}px`;
            submenu.style.right = 'auto';
        }
        else {
            // Safe to align right
            submenu.style.left = 'auto';
            submenu.style.right = '0';
        }
    }
}
function adjustMenuPosition(submenu) {
    // Reset to default to measure natural size/position
    submenu.style.left = '';
    submenu.style.right = '';
    const rect = submenu.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    // Check if it overflows the right edge
    if (rect.right > windowWidth) {
        // If it overflows, align to the right of the parent
        submenu.style.left = 'auto';
        submenu.style.right = '100%';
        // Note: 'right: 100%' generally puts it to the left of the parent if parent is relatively positioned.
        // Let's check CSS. .font-submenu is flex/relative. 
        // If we want it to open to the LEFT side of the trigger, we might need different logic.
        // Usually submenus open to the right (left: 100%).
        // To open to the left, we'd want right: 100% relative to the parent.
        // However, standard dropdowns might just need to shift. 
        // Let's try attempting to align right edge with viewport or parent.
        // Simple 'flip' to left side:
        submenu.style.left = 'auto';
        submenu.style.right = '100%'; // Position on the left side of the trigger
        // Check if that causes left overflow? (Rare for submenus unless very wide and very left)
    }
}
function isAnyMenuOpen() {
    const file = getFileDropdownElement();
    const font = getFontChooserElement();
    const para = getParagraphChooserElement();
    const hlControl = getHighlightControlElement();
    const view = document.querySelector('.view-dropdown');
    if (file && file.classList.contains('open'))
        return true;
    if (font && font.classList.contains('is-open'))
        return true;
    if (para && para.classList.contains('is-open'))
        return true;
    if (hlControl && hlControl.classList.contains('is-open'))
        return true;
    if (view && view.classList.contains('open'))
        return true;
    return false;
}
// File Menu
export function toggleFileDropdown() {
    const element = getFileDropdownElement();
    if (!element)
        return;
    const willOpen = !element.classList.contains('open');
    if (willOpen) {
        closeAllMenus('file');
    }
    element.classList.toggle('open', willOpen);
}
export function closeNestedDropdown() {
    getNestedDropdownElements().forEach(dropdown => {
        dropdown.classList.remove('open');
        const trigger = dropdown.querySelector('.nested-trigger');
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
        }
    });
}
export function closeFileDropdown() {
    const element = getFileDropdownElement();
    if (!element)
        return;
    element.classList.remove('open');
    closeNestedDropdown();
}
export function initFileMenuControls() {
    const fileTrigger = document.querySelector('.file-trigger');
    const nestedTriggers = document.querySelectorAll('.nested-trigger');
    if (fileTrigger) {
        fileTrigger.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleFileDropdown();
        });
        const fileMenu = fileTrigger.closest('.file-menu');
        if (fileMenu) {
            fileMenu.addEventListener('mouseenter', () => {
                if (isAnyMenuOpen())
                    return;
                // If closed, open it? Use toggleFileDropdown or explicit open?
                // toggleFileDropdown toggles. If closed, it opens.
                // But check internal state
                const element = getFileDropdownElement();
                if (element && !element.classList.contains('open')) {
                    closeAllMenus('file');
                    element.classList.add('open');
                }
            });
        }
    }
    nestedTriggers.forEach(trigger => {
        trigger.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const dropdown = trigger.closest('.nested-dropdown');
            if (!dropdown)
                return;
            const willOpen = !dropdown.classList.contains('open');
            closeNestedDropdown();
            dropdown.classList.toggle('open', willOpen);
            trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        });
    });
}
// Font Menu
export function setFontMenuOpen(open) {
    const fontChooserElement = getFontChooserElement();
    if (!fontChooserElement)
        return;
    fontChooserElement.classList.toggle('is-open', open);
    const trigger = fontChooserElement.querySelector('.font-chooser-trigger');
    if (trigger) {
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    if (open) {
        // Adjust position of the main panel
        const panel = fontChooserElement.querySelector('.font-chooser-panel');
        if (panel) {
            adjustMenuPositionSafe(panel);
        }
    }
    else {
        closeAllFontSubmenus();
    }
}
export function closeAllFontSubmenus() {
    const fontChooserElement = getFontChooserElement();
    if (!fontChooserElement)
        return;
    fontChooserElement.querySelectorAll('.font-submenu').forEach(submenu => {
        submenu.classList.remove('is-open');
        const trigger = submenu.querySelector('.font-submenu-trigger');
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
        }
    });
}
export function toggleFontMenu() {
    const fontChooserElement = getFontChooserElement();
    if (!fontChooserElement)
        return;
    const willOpen = !fontChooserElement.classList.contains('is-open');
    if (willOpen) {
        closeAllMenus('font');
    }
    setFontMenuOpen(willOpen);
}
export function closeFontMenu() {
    setFontMenuOpen(false);
}
export function closeFontSubmenu(type) {
    const fontChooserElement = getFontChooserElement();
    if (!fontChooserElement || !type)
        return;
    const submenu = fontChooserElement.querySelector(`.font-submenu[data-submenu="${type}"]`);
    if (!submenu)
        return;
    submenu.classList.remove('is-open');
    const trigger = submenu.querySelector('.font-submenu-trigger');
    if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
    }
}
export function initFontChooserControls() {
    const fontChooserElement = getFontChooserElement();
    if (!fontChooserElement)
        return;
    const fontChooserTriggerElement = fontChooserElement.querySelector('.font-chooser-trigger');
    const fontSubmenuTriggerElements = Array.from(fontChooserElement.querySelectorAll('.font-submenu-trigger'));
    if (fontChooserTriggerElement) {
        fontChooserTriggerElement.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleFontMenu();
        });
    }
    fontSubmenuTriggerElements.forEach(trigger => {
        const submenu = trigger.closest('.font-submenu');
        if (!submenu)
            return;
        // Hover to open
        submenu.addEventListener('mouseenter', () => {
            closeAllFontSubmenus();
            submenu.classList.add('is-open');
            trigger.setAttribute('aria-expanded', 'true');
            // Adjust position
            const panel = submenu.querySelector('.font-submenu-panel');
            if (panel) {
                adjustMenuPositionSafe(panel);
            }
        });
        trigger.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const willOpen = !submenu.classList.contains('is-open');
            closeAllFontSubmenus();
            submenu.classList.toggle('is-open', willOpen);
            trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
            if (willOpen) {
                setFontMenuOpen(true);
                const panel = submenu.querySelector('.font-submenu-panel');
                if (panel) {
                    adjustMenuPositionSafe(panel);
                }
            }
        });
    });
    // Sticky Hover for Font Menu
    if (fontChooserElement) {
        fontChooserElement.addEventListener('mouseenter', () => {
            if (isAnyMenuOpen())
                return;
            setFontMenuOpen(true);
        });
    }
    // Font Family Options
    const fontButtons = document.querySelectorAll('.font-family-option');
    fontButtons.forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            const family = btn.dataset.family;
            if (family) {
                window.applyFontFamily?.(family);
                closeFontMenu();
            }
        });
    });
}
// Paragraph Menu
export function closeAllParagraphSubmenus() {
    const paragraphChooserElement = getParagraphChooserElement();
    if (!paragraphChooserElement)
        return;
    paragraphChooserElement.querySelectorAll('.paragraph-submenu').forEach(submenu => {
        submenu.classList.remove('is-open');
        const trigger = submenu.querySelector('.paragraph-submenu-trigger');
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
        }
    });
}
export function setParagraphMenuOpen(open) {
    const paragraphChooserElement = getParagraphChooserElement();
    if (!paragraphChooserElement)
        return;
    paragraphChooserElement.classList.toggle('is-open', open);
    const paragraphTriggerElement = paragraphChooserElement.querySelector('.paragraph-trigger');
    if (paragraphTriggerElement) {
        paragraphTriggerElement.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    if (open) {
        // Adjust position of the main panel
        const panel = paragraphChooserElement.querySelector('.paragraph-panel');
        if (panel) {
            adjustMenuPositionSafe(panel);
        }
    }
    else {
        closeAllParagraphSubmenus();
    }
}
export function toggleParagraphMenu() {
    const paragraphChooserElement = getParagraphChooserElement();
    if (!paragraphChooserElement)
        return;
    const willOpen = !paragraphChooserElement.classList.contains('is-open');
    if (willOpen) {
        closeAllMenus('paragraph');
    }
    setParagraphMenuOpen(willOpen);
}
export function closeParagraphMenu() {
    setParagraphMenuOpen(false);
}
export function bindParagraphMenuListeners() {
    const paragraphChooserElement = getParagraphChooserElement();
    if (!paragraphChooserElement)
        return;
    const paragraphTriggerElement = paragraphChooserElement.querySelector('.paragraph-trigger');
    const paragraphSubmenuTriggerElements = Array.from(paragraphChooserElement.querySelectorAll('.paragraph-submenu-trigger'));
    if (paragraphTriggerElement) {
        paragraphTriggerElement.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleParagraphMenu();
        });
    }
    paragraphSubmenuTriggerElements.forEach(trigger => {
        const submenu = trigger.closest('.paragraph-submenu');
        if (!submenu)
            return;
        // Hover to open
        submenu.addEventListener('mouseenter', () => {
            closeAllParagraphSubmenus();
            submenu.classList.add('is-open');
            trigger.setAttribute('aria-expanded', 'true');
            // Adjust position
            const panel = submenu.querySelector('.paragraph-submenu-panel');
            if (panel) {
                adjustMenuPositionSafe(panel);
            }
        });
        trigger.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const willOpen = !submenu.classList.contains('is-open');
            closeAllParagraphSubmenus();
            submenu.classList.toggle('is-open', willOpen);
            trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
            if (willOpen) {
                setParagraphMenuOpen(true);
                const panel = submenu.querySelector('.paragraph-submenu-panel');
                if (panel) {
                    adjustMenuPositionSafe(panel);
                }
            }
        });
    });
    // Sticky Hover for Paragraph Menu
    if (paragraphChooserElement) {
        paragraphChooserElement.addEventListener('mouseenter', () => {
            if (isAnyMenuOpen())
                return;
            setParagraphMenuOpen(true);
        });
    }
}
// Highlight Palette
export function setHighlightPaletteOpen(open) {
    const highlightControlElement = getHighlightControlElement();
    if (!highlightControlElement)
        return;
    highlightControlElement.classList.toggle('is-open', open);
    // Clear inline display style so CSS class takes precedence
    const palette = highlightControlElement.querySelector('.highlight-palette');
    if (palette) {
        palette.style.display = '';
        if (open) {
            adjustMenuPositionSafe(palette);
        }
    }
    const trigger = highlightControlElement.querySelector('[data-action="highlight"]');
    if (trigger) {
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
}
export function toggleHighlightPalette() {
    const highlightControlElement = getHighlightControlElement();
    if (!highlightControlElement)
        return;
    const isOpen = highlightControlElement.classList.contains('is-open');
    if (!isOpen) {
        closeAllMenus('highlight');
        setHighlightPaletteOpen(true);
    }
    else {
        setHighlightPaletteOpen(false);
    }
}
// Close All
export function closeAllMenus(exclude) {
    if (exclude !== 'file')
        closeFileDropdown();
    if (exclude !== 'font') {
        closeFontMenu();
        closeAllFontSubmenus();
    }
    if (exclude !== 'paragraph')
        closeParagraphMenu();
    if (exclude !== 'highlight') {
        setHighlightPaletteOpen(false);
    }
    window.closeImageContextMenu?.();
    const viewDropdown = document.querySelector('.view-dropdown');
    if (exclude !== 'view' && viewDropdown) {
        viewDropdown.classList.remove('open');
    }
}
export function initViewMenuControls() {
    const viewTrigger = document.querySelector('.view-trigger');
    const viewDropdown = document.querySelector('.view-dropdown');
    if (viewTrigger && viewDropdown) {
        viewTrigger.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const willOpen = !viewDropdown.classList.contains('open');
            if (willOpen) {
                closeAllMenus('view');
            }
            viewDropdown.classList.toggle('open', willOpen);
        });
        const viewMenuElement = viewTrigger.closest('.view-menu');
        if (viewMenuElement) {
            viewMenuElement.addEventListener('mouseenter', () => {
                if (isAnyMenuOpen())
                    return;
                closeAllMenus('view');
                viewDropdown.classList.add('open');
            });
        }
    }
    const pageNumCheckbox = document.querySelector('input[data-action="toggle-page-numbers"]');
    if (pageNumCheckbox) {
        pageNumCheckbox.addEventListener('change', () => {
            document.body.classList.toggle('hide-page-numbers', !pageNumCheckbox.checked);
        });
    }
    const paraNumCheckbox = document.querySelector('input[data-action="toggle-para-numbers"]');
    const wordParaNumCheckbox = document.getElementById('word-toggle-para-numbers');
    if (paraNumCheckbox) {
        paraNumCheckbox.addEventListener('change', () => {
            const checked = paraNumCheckbox.checked;
            document.body.classList.toggle('hide-para-numbers', !checked);
            if (wordParaNumCheckbox)
                wordParaNumCheckbox.checked = checked;
        });
    }
}
export function initWordToolbarControls() {
    const wordParaNumCheckbox = document.getElementById('word-toggle-para-numbers');
    const stdParaNumCheckbox = document.querySelector('input[data-action="toggle-para-numbers"]');
    if (wordParaNumCheckbox) {
        wordParaNumCheckbox.addEventListener('change', () => {
            const checked = wordParaNumCheckbox.checked;
            document.body.classList.toggle('hide-para-numbers', !checked);
            if (stdParaNumCheckbox)
                stdParaNumCheckbox.checked = checked;
        });
    }
    const wordBlockSelector = document.getElementById('word-block-selector');
    if (wordBlockSelector) {
        wordBlockSelector.addEventListener('change', () => {
            applyBlockElement(wordBlockSelector.value);
        });
    }
}
export function initHighlightMenuControls() {
    const highlightControlElement = getHighlightControlElement();
    if (highlightControlElement) {
        highlightControlElement.addEventListener('mouseenter', () => {
            const anyOpen = isAnyMenuOpen();
            if (anyOpen)
                return;
            closeAllMenus('highlight');
            setHighlightPaletteOpen(true);
        });
    }
}
export function initHelpDialog() {
    const helpTrigger = document.getElementById('help-trigger');
    const helpDialog = document.getElementById('help-dialog');
    const subHelpDialog = document.getElementById('sub-help-dialog');
    if (helpTrigger && helpDialog) {
        helpTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            helpDialog.showModal();
        });
        // Close when clicking outside helpDialog
        helpDialog.addEventListener('click', (e) => {
            const rect = helpDialog.getBoundingClientRect();
            const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
                rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
            if (!isInDialog) {
                helpDialog.close();
            }
        });
        // Handle sub-help links inside helpDialog
        const subHelpLinks = helpDialog.querySelectorAll('[data-action="sub-help"]');
        subHelpLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                if (subHelpDialog) {
                    const type = link.innerText;
                    const subHelpTitleEl = document.getElementById('sub-help-dialog-label');
                    const subHelpContentEl = document.getElementById('sub-help-content');
                    if (subHelpTitleEl)
                        subHelpTitleEl.innerText = type;
                    if (subHelpContentEl) {
                        let content = '';
                        subHelpContentEl.classList.remove('is-small');
                        switch (type) {
                            case '利用規約':
                                subHelpContentEl.classList.add('is-small');
                                content = `
                                    <p>本規約は、当方が提供するWebアプリ「AI-Link Editor」（以下「本サービス」）の利用条件を定めるものです。利用者の皆様（以下「ユーザー」）には、本規約に従って本サービスをご利用いただきます。</p>
                                    <p class="section-title"><strong>第1条（適用）</strong></p>
                                    <p>本規約は、ユーザーと当方との間の本サービスの利用に関わる一切の関係に適用されるものとします。<br>
                                当方は本サービスに関し、本規約のほか、各種の規定（以下「個別規定」）をすることがあります。これら個別規定はその名称のいかんに関わらず、本規約の一部を構成するものとします。</p>

                                    <p class="section-title"><strong>第2条（サービスの内容およびデータの管理）</strong></p>
                                    <p>本サービスは、ブラウザ上で動作するフロントエンド完結型の文書エディタです。<br>本サービスは、ユーザーが入力したデータをサーバー上に保存する機能を有しておりません。データはユーザーのブラウザのローカルストレージまたは端末内にのみ保存されます。
                                    <br>ユーザーは、自己の責任においてデータのバックアップを行うものとします。</p>

                                    <p class="section-title"><strong>第3条（禁止事項）</strong></p><p> ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
                                    <br>・本サービスの運営を妨害するおそれのある行為。
                                    <br>・本サービスの逆コンパイル、逆アセンブル、リバースエンジニアリング等、ソースコードを解析する行為。
                                    <br>・その他、当方が不適切と判断する行為。</p>

                                    <p class="section-title"><strong>第4条（本サービスの提供の停止等）</strong></p>
                                    <p>当方は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。</p>
                                    <p>・本サービスに係るシステムの保守点検または更新を行う場合。<br>
                                    ・サーバーまたは通信回線等が事故により停止した場合。<br>
                                    ・その他、当方が本サービスの提供が困難と判断した場合。</p>
                                    <p>当方は、本サービスの提供の停止または中断により、ユーザーまたは第三者が被ったいかなる不利益または損害についても、一切の責任を負わないものとします。</p>

                                    <p class="section-title"><strong>第5条（免責事項）</strong></p>
                                    <p>当方は、本サービスに事実上または法律上の瑕疵（信頼性、正確性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害等）がないことを明示的にも黙示的にも保証しておりません。</p>
                                    <p>当方は、本サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。特に、本サービスの利用中に発生したデータの破損、消失、またはファイルが閲覧不能になったことによる損害について、当方は復旧の義務および賠償の責任を負わないものとします。</p>
                                    <p>ユーザーと他のユーザーまたは第三者との間において生じた取引、連絡または紛争等について、当方は一切責任を負いません。</p>

                                    <p class="section-title"><strong>第6条（サービス内容の変更等）</strong></p><p>当方は、ユーザーに通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。</p>

                                    <p class="section-title"><strong>第7条（利用規約の変更）</strong></p><p>当方は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。なお、本規約の変更後、本サービスの利用を開始した場合には、当該ユーザーは変更後の規約に同意したものとみなします。</p>

                                    <p class="section-title"><strong>第8条（準拠法・裁判管轄）</strong></p>
                                    <p>本規約の解釈にあたっては、日本法を準拠法とします。<br>
                                    本サービスに関して紛争が生じた場合には、当方の居住地を管轄する裁判所を専属的合意管轄とします。</p>
                                    <p>以上</p>
                                `;
                                break;
                            case 'プライバシーポリシー':
                                subHelpContentEl.classList.add('is-small');
                                content = `
                                    <p>当方は、本サービス「AI-Link Editor」において、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」）を定めます。</p>

                                    <p class="section-title"><strong>第1条（個人情報の収集について）</strong></p>
                                    <p>・入力データの非収集: 本サービスは、ユーザーがエディタに入力したテキスト、作成したファイル等のデータをサーバーに送信または保存することはありません。すべての処理はユーザーのブラウザ上（ローカル環境）で完結します。<br>
                                    ・自動的に収集される情報: サービスの改善および利用状況分析のため、Cookie（クッキー）やGoogleアナリティクス等のアクセス解析ツールを使用し、匿名化されたトラフィックデータを収集することがあります。これには個人を特定する情報は含まれません。</p>

                                    <p class="section-title"><strong>第2条（お問い合わせ情報の管理）</strong></p>
                                    <p>ユーザーからのお問い合わせ時に提供いただいた氏名やメールアドレス等の情報は、お問い合わせへの回答および必要な情報の連絡にのみ利用し、適切に管理いたします。</p>

                                    <p class="section-title"><strong>第3条（個人情報の第三者提供）</strong></p>
                                    <p>当方は、法令に基づき開示が必要な場合を除き、ユーザーの同意を得ることなく個人情報を第三者に提供することはありません。</p>

                                    <p class="section-title"><strong>第4条（個人情報の安全管理）</strong></p>
                                    <p>当方は、収集した情報の漏洩、滅失または毀損の防止、その他収集した情報の適切な管理のために必要な措置を講じます。</p>

                                    <p class="section-title"><strong>第5条（プライバシーポリシーの変更）</strong></p>
                                    <p>本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく変更することができるものとします。<br>
                                    当方が別途定める場合を除いて、変更後のプライバシーポリシーは、本ウェブサイトに掲載したときから効力を生じるものとします。</p>

                                    <p>以上</p>
                                `;
                                break;
                            case 'お問い合わせ':
                                subHelpContentEl.classList.add('is-small');
                                content = `
                                    <p>本サービスに関するお問い合わせは、以下のフォームより受け付けております。</p>
                                    <p><a href="https://docs.google.com/forms/d/e/1FAIpQLSddSA-8kVE7vKqJvlFJ2W07pBUmiDh-cqymT_KbHUmIoO3jvw/viewform?usp=dialog" target="_blank" style="color: #0891b2; text-decoration: underline;">お問い合わせフォーム</a></p>
                                    <p><strong>【お問い合わせの例】</strong></p>
                                    <p>・ローカルキット（完全版）の購入に関するご質問</p>
                                    <p>・バグ報告、改善要望</p>
                                    <p>・取材、お仕事のご依頼</p>
                                    <p><strong>【注意事項（あらかじめご了承ください）】</strong></p>
                                    <p>・開発者が個人で運営しているため、返信には数日〜1週間ほどお時間をいただく場合があります。</p>
                                    <p>・内容によっては返信を差し控えさせていただくことがございます。</p>
                                    <p>・ブラウザの操作方法やPC自体の使い方など、本サービスに直接関係のないサポートは行っておりません。</p>
                                `;
                                break;
                            default:
                                content = '<p>詳細情報は現在準備中です。</p>';
                        }
                        subHelpContentEl.innerHTML = content;
                    }
                    subHelpDialog.showModal();
                }
            });
        });
    }
    if (subHelpDialog) {
        // Close when clicking outside subHelpDialog
        subHelpDialog.addEventListener('click', (e) => {
            const rect = subHelpDialog.getBoundingClientRect();
            const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
                rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
            if (!isInDialog) {
                subHelpDialog.close();
            }
        });
    }
}
export function initModeSwitch() {
    const btn = document.getElementById('mode-switch');
    if (!btn)
        return;
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const current = getMode();
        const next = current === 'standard' ? 'word' : 'standard';
        switchMode(next);
    });
}
