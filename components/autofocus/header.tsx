"use client";

import { Moon, Sun, Settings, Type, Palette, TreePine } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { AboutSection } from "./about-section";
import { SettingsModal } from "./settings-modal";

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

const THEMES = [
	{ value: "light", label: "Light", icon: Sun },
	{ value: "dark", label: "Dark", icon: Moon },
	{ value: "golden-twilight", label: "Golden Twilight", icon: Palette },
	{ value: "mossy-woods", label: "Mossy Woods", icon: TreePine },
] as const;

export function Header() {
	const { theme, setTheme, themes } = useTheme();
	const [fontFamily, setFontFamily] = useState<"default" | "rubik">("default");
	const [showSettings, setShowSettings] = useState(false);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const handleThemeChange = (newTheme: string) => {
		const root = document.documentElement;

		// remove all themes first
		root.classList.remove("dark", "golden-twilight", "mossy-woods");

		if (newTheme !== "light") {
			root.classList.add(newTheme);
		}

		// sync with next-themes
		setTheme(newTheme);
	};

	const getCurrentThemeIcon = () => {
		if (!mounted) return Sun;
		const currentTheme = THEMES.find((t) => t.value === theme);
		return currentTheme?.icon || Sun;
	};

	const getCurrentThemeLabel = () => {
		if (!mounted) return "Light";
		const currentTheme = THEMES.find((t) => t.value === theme);
		return currentTheme?.label || "Light";
	};

	const toggleFont = () => {
		const newFont = fontFamily === "default" ? "rubik" : "default";
		setFontFamily(newFont);
		document.documentElement.classList.toggle(
			"font-rubik",
			newFont === "rubik",
		);
		localStorage.setItem("font-family", newFont);
	};

	useEffect(() => {
		const savedFont = localStorage.getItem("font-family") as
			| "default"
			| "rubik"
			| null;
		if (savedFont) {
			setFontFamily(savedFont);
			document.documentElement.classList.toggle(
				"font-rubik",
				savedFont === "rubik",
			);
		}
	}, []);

	return (
		<header className="flex items-center justify-between px-6 py-4">
			<div>
				<h1 className="text-sm tracking-[0.3em] font-medium">
					AUT<span className="text-af4-olive">O</span>FOCUS
				</h1>
				<p className="text-[0.625rem] uppercase text-muted-foreground mt-0.5">
					AF4 — One list. One task. Trust the process.
				</p>
			</div>
			<div className="flex items-center gap-2">
				<AboutSection />
				<button
					onClick={() => setShowSettings(true)}
					className="p-2 hover:bg-accent rounded transition-colors"
					aria-label="Settings"
				>
					<Settings className="w-4 h-4" />
				</button>
				<button
					onClick={toggleFont}
					className="p-2 hover:bg-accent rounded transition-colors"
					aria-label="Toggle font"
					title={
						fontFamily === "default"
							? "Switch to Rubik"
							: "Switch to Geist Mono"
					}
				>
					<Type className="w-4 h-4" />
				</button>

				{/* ============================ THEME SELECTOR ==========================  */}
				<Popover>
					<PopoverTrigger asChild>
						<button
							className="p-2 hover:bg-accent rounded transition-colors flex items-center gap-1"
							aria-label="Select theme"
							title={`Current: ${getCurrentThemeLabel()}`}
						>
							{(() => {
								const Icon = getCurrentThemeIcon();
								return <Icon className="w-4 h-4" />;
							})()}
						</button>
					</PopoverTrigger>
					<PopoverContent className="w-48 p-2" align="end">
						<div className="flex flex-col gap-1">
							{THEMES.map((t) => {
								const Icon = t.icon;
								const isSelected = theme === t.value;
								return (
									<button
										key={t.value}
										onClick={() => handleThemeChange(t.value)}
										className={`
											w-full text-left py-2 px-3 text-sm rounded hover:bg-accent transition-colors flex items-center gap-2
											${
												isSelected
													? "bg-accent text-accent-foreground"
													: "text-muted-foreground hover:text-foreground"
											}
										`}
									>
										<Icon className="w-4 h-4" />
										{t.label}
									</button>
								);
							})}
						</div>
					</PopoverContent>
				</Popover>
			</div>
			<SettingsModal
				isOpen={showSettings}
				onClose={() => setShowSettings(false)}
			/>
		</header>
	);
}
