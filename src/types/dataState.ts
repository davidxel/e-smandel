import type {
  Assignment,
  Attendance,
  ClassRoom,
  CompetitionEntry,
  CompetitionStatusHistory,
  GuestVisit,
  KbmLog,
  KokurikulerProject,
  LateArrival,
  PointHistory,
  PointRedemption,
  PointRedemptionRequest,
  Student,
  StudentAssignment,
  TeachingJournal,
  User,
  ViolationMaster,
  WaliKelasNote,
} from './schema'

export type DataState = {
  users: User[]
  students: Student[]
  classes: ClassRoom[]
  assignments: Assignment[]
  studentAssignments: StudentAssignment[]
  teachingJournals: TeachingJournal[]
  violations: ViolationMaster[]
  attendance: Attendance[]
  pointHistory: PointHistory[]
  pointRedemptions: PointRedemption[]
  pointRedemptionRequests: PointRedemptionRequest[]
  lateArrivals: LateArrival[]
  guestVisits: GuestVisit[]
  kbmLogs: KbmLog[]
  competitions: CompetitionEntry[]
  competitionStatusHistory: CompetitionStatusHistory[]
  waliKelasNotes: WaliKelasNote[]
  kokurikulerProjects: KokurikulerProject[]
}
