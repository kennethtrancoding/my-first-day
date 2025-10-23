import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Search, MessageCircle, CheckCircle2, Clock, Users } from "lucide-react";

import MentorDashboardLayout from "@/features/mentor/components/MentorDashboardLayout";
import { students, Student } from "@/people";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStoredState } from "@/hooks/useStoredState";
import { getCurrentEmail } from "@/utils/auth";
import {
	useNotifications,
	pushNotificationToOtherRole,
	getDisplayNameForCurrentAccount,
} from "@/hooks/useNotifications";

type StatusFilter = "all" | "pending" | "active";

function getStatusLabel(student: Student) {
	if (!student.assignedToMentor) {
		return "Awaiting approval";
	}
	return student.hasConnected ? "Active connection" : "Approved";
}

const statusConfig: Record<Exclude<StatusFilter, "all">, (student: Student) => boolean> = {
	pending: (student) => !student.assignedToMentor,
	active: (student) => student.assignedToMentor,
};

function cloneStudentRecords(): Student[] {
	return students.map((student) => ({
		...student,
		conversation: student.conversation.map((message) => ({ ...message })),
	}));
}

const MentorRequestManagementPage = () => {
	const navigate = useNavigate();
	const currentEmail = React.useMemo(() => getCurrentEmail() || "guest-mentor", []);
	const storagePrefix = React.useMemo(
		() => `user:${currentEmail}:mentorRequests`,
		[currentEmail]
	);
	const [query, setQuery] = useStoredState<string>(`${storagePrefix}:query`, "");
	const [statusFilter, setStatusFilter] = useStoredState<StatusFilter>(
		`${storagePrefix}:statusFilter`,
		"pending"
	);
	const [records, setRecords] = useStoredState<Student[]>(`${storagePrefix}:records`, () =>
		cloneStudentRecords()
	);
	const { addNotification: addMentorNotification } = useNotifications("mentor");
	const mentorDisplayName = React.useMemo(
		() => getDisplayNameForCurrentAccount() ?? "Your mentor",
		[]
	);

	const pendingCount = React.useMemo(
		() => records.filter((student) => !student.assignedToMentor).length,
		[records]
	);
	const activeCount = React.useMemo(
		() => records.filter((student) => student.assignedToMentor).length,
		[records]
	);

	const filtered = React.useMemo(() => {
		return records.filter((student) => {
			const matchesSearch =
				query.trim().length === 0 ||
				student.name.toLowerCase().includes(query.toLowerCase()) ||
				student.bio.toLowerCase().includes(query.toLowerCase());

			const matchesStatus =
				statusFilter === "all" ? true : statusConfig[statusFilter](student);

			return matchesSearch && matchesStatus;
		});
	}, [query, statusFilter, records]);

	function handleApprove(studentId: number) {
		const student = records.find((entry) => entry.id === studentId);
		const studentName = student?.name ?? "a student";
		const nowStr = new Date().toLocaleString();
		const nowUnix = Date.now();
		setRecords((prev) =>
			prev.map((student) =>
				student.id === studentId
					? {
							...student,
							assignedToMentor: true,
							hasConnected: true,
							lastMessage: nowStr,
							lastMessageUnix: nowUnix,
					  }
					: student
			)
		);
		addMentorNotification({
			message: `Approved request from ${studentName}.`,
			type: "connection",
			contextId: studentId,
		});
		pushNotificationToOtherRole(
			"student",
			`${mentorDisplayName} accepted your request.`,
			{
				type: "connection",
				contextId: studentId,
				link: `/student/home/messages/${studentId}`,
			}
		);
	}

	function handleMessage(studentId: number) {
		navigate(`/mentor/home/messages/${studentId}`);
	}

	return (
		<MentorDashboardLayout activePage="requests">
			<div className="space-y-8">
				<section className="space-y-4">
					<div className="flex flex-col gap-2">
						<h1 className="text-2xl font-bold">Incoming Student Requests</h1>
						<p className="text-muted-foreground">
							Review new mentorship requests, approve connections, and jump into a
							conversation when you're ready.
						</p>
					</div>

					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between pb-2">
								<CardTitle className="text-sm font-medium">
									Pending Requests
								</CardTitle>
								<Clock className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{pendingCount}</div>
								<p className="text-xs text-muted-foreground">
									Students awaiting your approval
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between pb-2">
								<CardTitle className="text-sm font-medium">
									Active Students
								</CardTitle>
								<Users className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{activeCount}</div>
								<p className="text-xs text-muted-foreground">
									Connections you're supporting
								</p>
							</CardContent>
						</Card>
					</div>
				</section>

				<section className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Request Inbox</CardTitle>
							<CardDescription>
								Filter by status, scan student interests, and approve the
								connections you can support.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="flex flex-col gap-4 md:flex-row md:items-center">
								<div className="relative w-full md:max-w-sm">
									<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										value={query}
										onChange={(event) => setQuery(event.target.value)}
										placeholder="Search by name or interests"
										className="pl-10"
										aria-label="Search students"
									/>
								</div>

								<Tabs
									value={statusFilter}
									onValueChange={(value) =>
										setStatusFilter(value as StatusFilter)
									}
									className="w-full md:w-auto">
									<TabsList className="grid w-full grid-cols-3 md:w-auto">
										<TabsTrigger value="pending">Pending</TabsTrigger>
										<TabsTrigger value="active">Active</TabsTrigger>
										<TabsTrigger value="all">All</TabsTrigger>
									</TabsList>
								</Tabs>
							</div>

							<Tabs value={statusFilter} className="w-full">
								<TabsContent value={statusFilter} className="mt-0">
									<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
										{filtered.map((student) => (
											<Card key={student.id} className="flex flex-col">
												<CardHeader className="space-y-2">
													<div className="flex items-start justify-between gap-3">
														<div>
															<CardTitle className="text-base">
																{student.name}
															</CardTitle>
															<p className="text-xs text-muted-foreground">
																Grade {student.grade}
															</p>
														</div>
														<Badge variant="secondary">
															{getStatusLabel(student)}
														</Badge>
													</div>
												</CardHeader>
												<CardContent className="flex-1 space-y-3 text-sm text-muted-foreground">
													<p className="line-clamp-3">{student.bio}</p>
													<div className="rounded-md border bg-muted/30 p-3">
														<p className="text-xs font-medium text-muted-foreground">
															Recent Activity
														</p>
														<p className="text-xs">
															Last updated {student.lastMessage}
														</p>
													</div>
												</CardContent>
												<CardFooter className="mt-auto flex flex-wrap gap-2">
													{!student.assignedToMentor && (
														<Button
															size="sm"
															className="gap-1"
															onClick={() =>
																handleApprove(student.id)
															}>
															<CheckCircle2 className="h-4 w-4" />
															Approve
														</Button>
													)}
													<Button
														variant="outline"
														size="sm"
														className="gap-1"
														onClick={() => handleMessage(student.id)}>
														<MessageCircle className="h-4 w-4" />
														Message
													</Button>
												</CardFooter>
											</Card>
										))}
										{filtered.length === 0 && (
											<div className="col-span-full flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/50 py-12 text-center">
												<p className="text-sm font-medium">
													No students found
												</p>
												<p className="text-xs text-muted-foreground max-w-sm">
													Adjust your filters or check back later for new
													requests.
												</p>
											</div>
										)}
									</div>
								</TabsContent>
							</Tabs>
						</CardContent>
					</Card>
				</section>
			</div>
		</MentorDashboardLayout>
	);
};

export default MentorRequestManagementPage;
