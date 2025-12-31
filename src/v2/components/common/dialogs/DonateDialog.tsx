import React from 'react';
import { BaseDialog } from '@/components/ui/BaseDialog';
import { Heart, User, Lightbulb } from 'lucide-react';

interface DonateDialogProps {
    open: boolean;
    onClose: () => void;
}

/**
 * 寄付ダイアログ（v1からのコンテンツを完全移植）
 */
export const DonateDialog: React.FC<DonateDialogProps> = ({ open, onClose }) => {
    return (
        <BaseDialog
            open={open}
            onOpenChange={onClose}
            title="AI-Link Editorを応援しませんか？"
            maxWidth="md"
        >
            <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                <p className="text-sm leading-relaxed text-gray-700">
                    いつもご利用ありがとうございます！<br />
                    このAI-Link Editorは、「快適なAIアシスト編集環境を提供したい」という想いから、個人で開発・運営しています。
                    開発経費や維持費は皆様の温かいご支援で支えられており、おかげで「全機能・完全無料」を継続できています。
                    もしこのツールがあなたの役に立ったら、エディタを気に入っていただけたら、開発の継続を応援していただけると、サービス改善・向上の励みになります！
                </p>

                {/* Special Thanks Box */}
                <div className="bg-pink-50/50 border border-pink-100 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                        <h2 className="font-bold text-pink-900">Special Thanks</h2>
                    </div>
                    <p className="text-[11px] text-pink-700 mb-3">
                        （ご支援いただいた方は、感謝を込めてお名前を掲載させていただきます！ ※決済画面の入力欄に、ご希望のハンドルネームをご記入ください。）
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <span className="text-sm font-medium text-pink-800 bg-white px-3 py-1 rounded-full shadow-sm border border-pink-100">
                            ha-chan 様
                        </span>
                    </div>
                </div>

                {/* Donate Buttons */}
                <div className="pt-2">
                    <a 
                        href="https://donate.stripe.com/28E5kFakIfEre910Z01sQ00" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block w-full py-4 px-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl shadow-lg shadow-cyan-100 transition-all text-center group"
                    >
                        <span className="block text-lg font-bold group-hover:scale-[1.01] transition-transform">
                            500円〜（コーヒー1杯分程度）寄付を行う
                        </span>
                        <span className="text-xs opacity-90 block mt-1">
                            ※安全な決済システム（Stripe）へ移動します。
                        </span>
                    </a>
                </div>

                {/* Developer Profile */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gray-100 rounded-lg">
                            <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <h2 className="font-bold text-gray-800 text-base">開発者プロフィール</h2>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-600">
                        1999年生まれ。埼玉県出身。東京大学農学部卒。在学中に自律神経失調症を患い、卒業後は「東大卒ニート」として療養生活を送る。現在は回復し、フリーランスのボイストレーナーをしながら、AIを駆使した開発に挑戦中。<br />
                        無類のyasu（Acid Black Cherry）好き。人生のテーマは「本質に向き合うこと」。
                    </p>
                </div>

                {/* Development Background */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gray-100 rounded-lg">
                            <Lightbulb className="w-5 h-5 text-gray-600" />
                        </div>
                        <h2 className="font-bold text-gray-800 text-base">開発の経緯</h2>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-600">
                        理系出身なのに、突然「経済学を学びたい！」と思い立ったのが始まりでした。<br />
                        ChatGPTと協力してまとめテキストを作ろうとしたのですが、既存のWordやPDFではAIが「何ページ目のどこを編集しているか」を正確に把握できず、スムーズに連携できないことにイライラ……。<br />
                        「だったら、AIが迷わない専用エディタを自分で作ればいいじゃん！」と決意。<br />
                        プログラミング未経験でしたが、ChatGPTやGeminiを相棒に、二人三脚でこのアプリを形にしました。
                    </p>
                </div>
            </div>
        </BaseDialog>
    );
};
