import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, ChevronDown } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-red-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="p-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-4 bg-red-50 rounded-full">
                  <AlertOctagon className="w-12 h-12 text-red-500" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-gray-900">予期せぬエラーが発生しました</h2>
                <p className="text-sm text-gray-500">アプリケーションの実行中に問題が発生しました。ページを再読み込みして解決しない場合は、管理者にお問い合わせください。</p>
              </div>

              {this.state.error && (
                <details className="group text-left bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                  <summary className="flex items-center justify-between px-4 py-3 text-xs font-bold text-gray-700 cursor-pointer list-none hover:bg-gray-100 transition-colors">
                    <span>エラー詳細を確認する</span>
                    <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-4 pb-4 text-[10px] text-red-400 font-mono break-all whitespace-pre-wrap leading-relaxed border-t border-gray-100 pt-3">
                    {this.state.error.toString()}
                  </div>
                </details>
              )}

              <button 
                onClick={() => window.location.reload()} 
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>ページを再読み込み</span>
              </button>
            </div>
            
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Error System v2.0</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
