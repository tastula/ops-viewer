import { CourseUnitSubstitution, LocalizedString, OrganisationRoleShare, PrerequisiteGroup } from ".";

// TODO: Add remaining fields
export default interface CourseUnit {
    approvalState: string;
    code: string;
    compulsoryFormalPrerequisites: PrerequisiteGroup[] | null;
    courseUnitType: string;
    curriculumPeriodIds: string[];
    documentState: string;
    equivalentCoursesInfo: LocalizedString | null;
    gradeScaleId: string;
    groupId: string;
    id: string;
    name: LocalizedString;
    organisations: OrganisationRoleShare[];
    prereqisites: LocalizedString | null;
    recommendedFormalPrerequisites: PrerequisiteGroup[] | null;
    studyFields: string[];
    studyLevel: string;
    subject: string | null;
    // TODO: Is Substitution model really not used?
    substitutions: CourseUnitSubstitution[][] | null;
}
