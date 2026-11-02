import './globals.css';import {LanguageProvider} from '@/components/LanguageProvider';
export const metadata={title:'Social Media OS',description:'Private social media workspace'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body><LanguageProvider>{children}</LanguageProvider></body></html>}