import React, { useEffect, useRef } from 'react';
import { BaseDialog } from '@/components/ui/BaseDialog';
import { Heart, User, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';

interface DonateDialogProps {
    open: boolean;
    onClose: () => void;
}

/**
 * 寄付ダイアログ（v1からのコンテンツを完全移植）
 */

export const DonateDialog: React.FC<DonateDialogProps> = ({ open, onClose }) => {
    const { donateScrollToBottom, setDonateScrollToBottom } = useAppStore();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open && donateScrollToBottom && scrollContainerRef.current) {
            // ダイアログが開いた直後にスクロールを実行
            const container = scrollContainerRef.current;
            setTimeout(() => {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth'
                });
                // フラグをリセット
                setDonateScrollToBottom(false);
            }, 150); // アニメーション等の完了を待つために少し遅延
        }
    }, [open, donateScrollToBottom, setDonateScrollToBottom]);

    return (
        <BaseDialog
            open={open}
            onOpenChange={onClose}
            title={
                <div className="flex items-center gap-3">
                    <motion.div
                        animate={{ 
                            scale: [1, 1.15, 1],
                            rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                            duration: 3, 
                            repeat: Infinity,
                            ease: "easeInOut" 
                        }}
                        className="p-2 bg-orange-100/50 rounded-full"
                    >
                        <Heart className="w-6 h-6 text-orange-500 fill-orange-500/30" />
                    </motion.div>
                    <span className="text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-700 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.05)]">
                        AI-Link Editorを応援しませんか？
                    </span>
                </div>
            }
            titleClassName="text-[1.8rem] font-black leading-tight tracking-tight py-1"
            maxWidth="lg"
        >
            <div 
                ref={scrollContainerRef}
                className="space-y-8 overflow-y-auto max-h-[70vh] pr-4 scrollbar-thin scrollbar-thumb-gray-200 font-['Noto_Sans_JP',sans-serif]"
            >
                <p className="text-[15px] leading-relaxed text-slate-500 font-medium">
                    いつもご利用ありがとうございます！<br />
                    このAI-Link Editorは、「快適なAIアシスト編集環境を提供したい」という想いから、個人で開発・運営しています。
                    開発経費や維持費は皆様の温かいご支援で支えられており、おかげで「全機能・完全無料」を継続できています。
                    もしこのツールがあなたの役に立ったら、エディタを気に入っていただけたら、開発の継続を応援していただけると、サービス改善・向上の励みになります！
                </p>

                {/* Special Thanks Box */}
                <div className="bg-orange-50/40 border border-orange-100/60 p-6 rounded-3xl shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Heart className="w-20 h-20 text-orange-500 fill-orange-500" />
                    </div>
                    <div className="flex items-center gap-2.5 mb-2.5 relative z-10">
                        <Heart className="w-5 h-5 text-orange-500 fill-orange-500" />
                        <h2 className="font-bold text-orange-900 text-base">Special Thanks</h2>
                    </div>
                    <p className="text-[12px] text-orange-700/80 mb-4 leading-relaxed relative z-10 max-w-[90%]">
                        （ご支援いただいた方は、感謝を込めてお名前を掲載させていただきます！<br />※決済画面の入力欄に、ご希望のハンドルネームをご記入ください。）
                    </p>
                    <div className="flex flex-wrap gap-2.5 relative z-10">
                        <span className="text-sm font-bold text-orange-800 bg-white px-5 py-2 rounded-2xl shadow-sm border border-orange-100">
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
                        className="block w-full py-6 px-8 bg-gradient-to-br from-orange-400 to-amber-600 hover:from-orange-500 hover:to-amber-700 text-white rounded-3xl shadow-xl shadow-orange-100 transition-all text-center group active:scale-[0.99] border-b-4 border-amber-700/30"
                    >
                        <span className="block text-lg font-bold group-hover:scale-[1.01] transition-transform">
                            500円〜（コーヒー1杯分程度）寄付を行う
                        </span>
                        <span className="text-[12px] opacity-90 block mt-2 font-medium tracking-wide">
                            ※安全な決済システム（Stripe）へ移動します。
                        </span>
                    </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Developer Profile */}
                    <div className="bg-slate-50/80 border border-slate-100 p-6 rounded-3xl space-y-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl shadow-sm">
                                <User className="w-5 h-5 text-slate-600" />
                            </div>
                            <h2 className="font-bold text-slate-800 text-base">開発者プロフィール</h2>
                        </div>
                        <p className="text-[13px] leading-relaxed text-slate-600 font-medium whitespace-pre-wrap">
                            1999年生まれ。埼玉県出身。東京大学農学部卒。在学中に自律神経失調症を患い、卒業後は療養生活を送る。現在は回復し、フリーランスのボイストレーナーをしながら、AIを駆使した開発に挑戦中。
                            無類のyasu（Acid Black Cherry）好き。人生のテーマは「本質に向き合うこと」。
                        </p>
                    </div>

                    {/* Development Background */}
                    <div className="bg-slate-50/80 border border-slate-100 p-6 rounded-3xl space-y-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl shadow-sm">
                                <Lightbulb className="w-5 h-5 text-slate-600" />
                            </div>
                            <h2 className="font-bold text-slate-800 text-base">開発の経緯</h2>
                        </div>
                        <p className="text-[13px] leading-relaxed text-slate-600 font-medium whitespace-pre-wrap">
                            経済学を学びたいと思い立ち、ChatGPTとまとめテキストを作ろうとした際に、既存ツールではAIとの連携がスムーズにいかないことに不便を感じ、「AIが迷わない専用エディタ」の自作を決意。
                            プログラミング未経験から二人三脚で本アプリを形にしました。
                        </p>
                    </div>
                </div>
            </div>
        </BaseDialog>
    );
};
