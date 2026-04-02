"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Moon, Sun, Type, Palette, TreePine } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const THEMES = [
	{ value: "light", label: "Light", icon: Sun },
	{ value: "dark", label: "Dark", icon: Moon },
	{ value: "golden-twilight", label: "Golden Twilight", icon: Palette },
	{ value: "mossy-woods", label: "Mossy Woods", icon: TreePine },
] as const;

interface SettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
	const { theme, setTheme } = useTheme();
	const [fontFamily, setFontFamily] = useState<"default" | "rubik">("default");
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

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

	const toggleFont = () => {
		const newFont = fontFamily === "default" ? "rubik" : "default";
		setFontFamily(newFont);
		document.documentElement.classList.toggle(
			"font-rubik",
			newFont === "rubik",
		);
		localStorage.setItem("font-family", newFont);
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

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-sm tracking-[0.2em] font-medium">
						SETT<span className="text-af4-olive">I</span>NGS
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{/* Theme Section */}
					<div className="space-y-3">
						<div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
							{(() => {
								const Icon = getCurrentThemeIcon();
								return <Icon className="w-3 h-3" />;
							})()}
							<span>Theme</span>
						</div>
						<div className="grid grid-cols-2 gap-2">
							{THEMES.map((t) => {
								const Icon = t.icon;
								const isSelected = theme === t.value;
								return (
									<button
										key={t.value}
										onClick={() => handleThemeChange(t.value)}
										className={`
											flex items-center gap-2 px-3 py-2 text-sm rounded border transition-all
											${
												isSelected
													? "border-af4-olive bg-accent text-foreground"
													: "border-border hover:border-muted-foreground/50 text-muted-foreground"
											}
										`}
									>
										<Icon className="w-4 h-4" />
										<span>{t.label}</span>
									</button>
								);
							})}
						</div>
						<p className="text-[0.625rem] text-muted-foreground">
							Current: {getCurrentThemeLabel()}
						</p>
					</div>

					<hr className="border-border" />

					{/* Font Section */}
					<div className="space-y-3">
						<div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
							<Type className="w-3 h-3" />
							<span>Typography</span>
						</div>
						<button
							onClick={toggleFont}
							className="flex items-center justify-between w-full px-3 py-2 text-sm rounded border border-border hover:border-muted-foreground/50 transition-all"
						>
							<div className="flex items-center gap-2">
								<span className={fontFamily === "rubik" ? "font-rubik" : ""}>
									{fontFamily === "default" ? "Geist Mono" : "Rubik"}
								</span>
							</div>
							<span className="text-[0.625rem] text-muted-foreground">
								{fontFamily === "default"
									? "Switch to Rubik"
									: "Switch to Geist Mono"}
							</span>
						</button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
