import { createTheme } from '@mui/material/styles';

// プロフェッショナルでモダンなダークテーマを定義
const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#6366f1', // Indigo系: 知的でモダンな印象
            light: '#818cf8',
            dark: '#4338ca',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#ec4899', // Pink系: アクセント
            light: '#f472b6',
            dark: '#db2777',
            contrastText: '#ffffff',
        },
        background: {
            default: '#0f172a', // 深いSlate色: 真っ黒より目に優しく高級感がある
            paper: '#1e293b',   // コンポーネントの背景色
        },
        text: {
            primary: '#f8fafc',
            secondary: '#cbd5e1',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 700,
            fontSize: '2.5rem',
            letterSpacing: '-0.02em',
        },
        h2: {
            fontWeight: 600,
            fontSize: '2rem',
            letterSpacing: '-0.01em',
        },
        button: {
            textTransform: 'none', // 大文字強制を解除してモダンに
            fontWeight: 600,
        },
    },
    shape: {
        borderRadius: 12, // 角丸を少し大きめにして親しみやすさとモダンさを演出
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    },
                },
                containedPrimary: {
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', // グラデーションボタン
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none', // ダークモードのオーバーレイを無効化してクリーンに
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(30, 41, 59, 0.8)', // グラスモーフィズム風
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                },
            },
        },
    },
});

export default theme;
