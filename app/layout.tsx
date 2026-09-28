import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata={title:"AddisMovie — Ethiopian stories, anywhere",description:"A cinematic home for Ethiopian film, series and trailers."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}