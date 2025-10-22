import * as React from "react";
import {
	Card,
	CardHeader,
	CardFooter,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

const correctCode = "218058";

function SignupVerificationCode() {
	const navigate = useNavigate();

	const [code, setCode] = React.useState(["", "", "", "", "", ""]);
	const [error, setError] = React.useState(false);
	const inputContainerRef = React.useRef<HTMLDivElement>(null);
	const inputRefs = React.useRef<Array<HTMLInputElement | null>>([]);

	React.useEffect(() => {
		inputRefs.current[0]?.focus();
	}, []);

	function handleCodeChange(value: string, index: number) {
		if (isNaN(parseInt(value)) && value !== "") {
			return;
		}

		const updated = [...code];
		updated[index] = value;
		setCode(updated);

		if (updated.length === 6) {
			checkCode(updated.join(""));
		}
	}

	function checkCode(full?: string) {
		const fullCode = full ?? code.join("");

		if (fullCode.length === 6) {
			if (fullCode === correctCode) {
				window.location.href = "/onboarding/";
			} else {
				setCode(["", "", "", "", "", ""]);
				setError(true);
				inputRefs.current[0]?.focus();
			}
		}
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
		if (e.key === "Backspace") {
			if (code[index]) {
				handleCodeChange("", index);
			} else if (index > 0) {
				inputRefs.current[index - 1]?.focus();
				handleCodeChange("", index - 1);
			}
		}
	}

	function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
		const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
		if (!pasted) {
			return;
		}
		e.preventDefault();

		const newCode = Array(6)
			.fill("")
			.map((_, i) => pasted[i] ?? "");
		setCode(newCode);

		const nextIndex = newCode.findIndex((d) => d === "");
		inputRefs.current[nextIndex === -1 ? 5 : nextIndex]?.focus();

		if (pasted.length === 6) {
			checkCode(pasted);
		}
	}

	return (
		<div className="w-screen h-screen flex items-center justify-center backdrop-blur-[3px] bg-gradient-hero">
			<Card className="w-full max-w-sm">
				<CardHeader className="text-center">
					<CardTitle>Welcome to your new school!</CardTitle>
					<CardDescription>
						Enter your school-provided six-digit code to begin your registration.
					</CardDescription>
				</CardHeader>

				<CardContent className="grid gap-4">
					<div className="grid gap-2 text-center">
						<div
							ref={inputContainerRef}
							className="flex justify-center w-full transition-transform">
							{code.map((digit, index) => (
								<Input
									key={index}
									ref={(el) => (inputRefs.current[index] = el)}
									id={index.toString()}
									type="text"
									inputMode="numeric"
									pattern="\d*"
									maxLength={1}
									value={digit}
									onKeyDown={(e) => handleKeyDown(e, index)}
									onPaste={onPaste}
									onChange={(e) => {
										const val = e.target.value;
										handleCodeChange(val, index);
										if (val && index < 5) {
											inputRefs.current[index + 1]?.focus();
										}
									}}
									className="w-1/6 h-14 m-1 text-center !text-2xl tracking-widest uppercase"
									aria-label={`Digit ${index + 1}`}
								/>
							))}
						</div>
					</div>
				</CardContent>
				<CardFooter>
					<p id="error" className={error ? "text-red-600" : "hidden"}>
						Invalid code. Please try again.
					</p>
				</CardFooter>
			</Card>
		</div>
	);
}

export default SignupVerificationCode;
