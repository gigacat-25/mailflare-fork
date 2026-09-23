import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { PwaInstallBanner } from "@/components/pwa/install-prompt";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	viewportFit: "cover",
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#f6f8fc" },
		{ media: "(prefers-color-scheme: dark)", color: "#18181b" },
	],
};

export const metadata: Metadata = {
	title: "Mailflare",
	description: "Multi-tenant email on Cloudflare",
	manifest: "/manifest.webmanifest",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "Mailflare",
	},
	icons: {
		icon: "/api/branding/icon",
		apple: "/apple-touch-icon.png",
	},
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<link rel="icon" href="/api/branding/icon" />
				<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
			</head>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased light`}>
				<Providers>
					{children}
					<PwaRegister />
					<PwaInstallBanner />
				</Providers>
			</body>
		</html>
	);
}

