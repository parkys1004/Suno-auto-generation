import React, { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#141414] border border-red-500/20 rounded-2xl p-8 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-500 mb-2">
              <AlertCircle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">애플리케이션 오류</h1>
              <p className="text-gray-400 text-sm">
                예상치 못한 오류가 발생했습니다. 설정 데이터가 손상되었을 수 있습니다.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-black/40 rounded-xl p-4 text-left overflow-auto max-h-40">
                <code className="text-xs text-red-400 font-mono break-all">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" />
                다시 시도
              </button>
              
              <button
                onClick={this.handleReset}
                className="w-full py-3 bg-red-500/10 text-red-500 font-bold rounded-xl hover:bg-red-500/20 transition-colors text-sm"
              >
                모든 데이터 초기화 후 다시 시도
              </button>
            </div>
            
            <p className="text-[10px] text-gray-600">
              데이터 초기화 시 저장된 모든 곡과 API 키가 삭제됩니다.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
