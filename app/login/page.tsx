"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [otp, setOtp] = useState("");
	const [step, setStep] = useState<"email" | "otp">("email");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();
	const supabase = createClient();

	const handleSendOtp = async () => {
		if (!email.trim()) return;
		setLoading(true);
		setError(null);
		const { error } = await supabase.auth.signInWithOtp({
			email: email.trim(),
			options: { shouldCreateUser: false }, // only allow existing users
		});
		if (error) {
			setError(error.message);
		} else {
			setStep("otp");
		}
		setLoading(false);
	};

	const handleVerifyOtp = async () => {
		if (!otp.trim()) return;
		setLoading(true);
		setError(null);
		const { error } = await supabase.auth.verifyOtp({
			email: email.trim(),
			token: otp.trim(),
			type: "email",
		});
		if (error) {
			setError(error.message);
		} else {
			router.push("/");
			router.refresh();
		}
		setLoading(false);
	};

	return (
		<div className="min-h-screen bg-background flex items-center justify-center px-4">
			<div className="w-full max-w-sm flex flex-col gap-6">
				<div className="flex flex-col gap-1">
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">
						Welcome back
					</h1>
					<p className="text-sm text-muted-foreground">
						{step === "email"
							? "Enter your email to receive a login code."
							: `Code sent to ${email}. Check your inbox.`}
					</p>
				</div>

				{error && <p className="text-sm text-destructive">{error}</p>}

				{step === "email" ? (
					<div className="flex flex-col gap-3">
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
							placeholder="you@example.com"
							autoFocus
							className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
						/>
						<button
							onClick={handleSendOtp}
							disabled={loading || !email.trim()}
							className="w-full bg-foreground text-background rounded-lg py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? "Sending..." : "Send Code"}
						</button>
					</div>
				) : (
					<div className="flex flex-col gap-3">
						<input
							type="text"
							value={otp}
							onChange={(e) => setOtp(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
							placeholder="6-digit code"
							autoFocus
							maxLength={6}
							className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring tracking-widest"
						/>
						<button
							onClick={handleVerifyOtp}
							disabled={loading || otp.length < 6}
							className="w-full bg-foreground text-background rounded-lg py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? "Verifying..." : "Verify Code"}
						</button>
						<button
							onClick={() => {
								setStep("email");
								setOtp("");
								setError(null);
							}}
							className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
						>
							Use a different email
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
