import type { Metadata } from "next";
import { Geist_Mono, Rubik } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-geist-mono",
});

const rubik = Rubik({
	subsets: ["latin"],
	variable: "--font-rubik-family",
});

export const metadata: Metadata = {
	title: "Autofocus | Bring Order to Chaos",
	description: "AF4 - One list. One task. Trust the process.",
	icons: {
		icon: [
			{
				url: "/icon-light-32x32.png",
				media: "(prefers-color-scheme: light)",
			},
			{
				url: "/icon-dark-32x32.png",
				media: "(prefers-color-scheme: dark)",
			},
			{
				url: "/icon.svg",
				type: "image/svg+xml",
			},
		],
		apple: "/apple-icon.png",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={`${geistMono.variable} ${rubik.variable}`}
		>
			<body className="font-sans antialiased">
				<ThemeProvider
					attribute="class"
					defaultTheme="dark"
					enableSystem={false}
				>
					{children}
				</ThemeProvider>
				<Analytics />
			</body>
		</html>
	);
}
