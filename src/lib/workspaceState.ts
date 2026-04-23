import {
  buildInitialAssignments,
  buildInitialAttendance,
  buildInitialClasses,
  buildInitialCompetitions,
  buildInitialCompetitionStatusHistory,
  buildInitialGuestVisits,
  buildInitialKbmLogs,
  buildInitialLateArrivals,
  buildInitialPointHistory,
  buildInitialPointRedemptions,
  buildInitialPointRedemptionRequests,
  buildInitialStudents,
  buildInitialStudentAssignments,
  buildInitialTeachingJournals,
  buildInitialUsers,
  buildInitialViolations,
  buildPlaceholderStudentUsers,
} from '../data/initialSeed'
import type { CompetitionEntry, User } from '../types/schema'
import type { DataState } from '../types/dataState'

export function syncCompetitionMentorFlags(
  users: User[],
  competitions: CompetitionEntry[],
): User[] {
  const mentorIds = new Set(competitions.map((c) => c.mentorTeacherId))
  return users.map((u) => ({
    ...u,
    isCompetitionMentor:
      u.role === 'guru_mapel' ? mentorIds.has(u.id) : (u.isCompetitionMentor ?? false),
    isKokurikulerCoordinator: !!u.isKokurikulerCoordinator,
  }))
}

/** Snapshot data awal (tanpa action store) — dipakai klien & server seed. */
export function buildFreshWorkspaceData(): DataState {
  const classes = buildInitialClasses()
  return {
    users: [...buildInitialUsers(), ...buildPlaceholderStudentUsers()],
    students: buildInitialStudents(),
    classes,
    assignments: buildInitialAssignments(),
    studentAssignments: buildInitialStudentAssignments(),
    teachingJournals: buildInitialTeachingJournals(),
    violations: buildInitialViolations(),
    attendance: buildInitialAttendance(),
    pointHistory: buildInitialPointHistory(),
    pointRedemptions: buildInitialPointRedemptions(),
    pointRedemptionRequests: buildInitialPointRedemptionRequests(),
    lateArrivals: buildInitialLateArrivals(),
    guestVisits: buildInitialGuestVisits(),
    kbmLogs: buildInitialKbmLogs(),
    competitions: buildInitialCompetitions(),
    competitionStatusHistory: buildInitialCompetitionStatusHistory(),
    waliKelasNotes: [],
    kokurikulerProjects: [],
  }
}
